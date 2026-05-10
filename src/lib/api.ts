import type {
  AnalyzeResumesRequest,
  AnalyzeResumesResponse,
  Candidate,
  CandidateDetailRequest,
  CandidateDetailResponse,
  CandidateTier,
  Criteria,
  RefineJDRequest,
  RefineJDResponse,
  ResumeChunk,
} from "@/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const ENABLE_MOCK_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK !== "false";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
  options: { timeoutMs?: number } = {},
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    const data = parseResponseBody(rawBody);

    if (!response.ok) {
      const message = getErrorMessage(data) ?? `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as TResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The AI service took too long to respond. Try again.", 408);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseResponseBody(body: string): unknown {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function getErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if ("error" in data && typeof data.error === "string") {
    return data.error;
  }

  return null;
}

function shouldUseMockFallback(error: unknown): boolean {
  if (!ENABLE_MOCK_FALLBACK) {
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof ApiError) {
    return error.status === 404 || error.status === 405 || error.status === 408;
  }

  return false;
}

async function withMockFallback<TResponse>(
  request: () => Promise<TResponse>,
  mock: () => TResponse,
): Promise<TResponse> {
  if (USE_MOCK_API) {
    return mock();
  }

  try {
    return await request();
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mock();
    }

    throw error;
  }
}

export function refineJobDescription(payload: RefineJDRequest): Promise<RefineJDResponse> {
  return withMockFallback(
    () =>
      postJson<RefineJDResponse, RefineJDRequest>("/api/refine-jd", payload, {
        timeoutMs: 60000,
      }),
    () => mockRefineJobDescription(payload),
  );
}

export function analyzeResumes(
  payload: AnalyzeResumesRequest,
): Promise<AnalyzeResumesResponse> {
  return withMockFallback(
    () =>
      postJson<AnalyzeResumesResponse, AnalyzeResumesRequest>(
        "/api/analyze-resumes",
        payload,
        { timeoutMs: 180000 },
      ),
    () => mockAnalyzeResumes(payload),
  );
}

export function getCandidateDetail(
  payload: CandidateDetailRequest,
): Promise<CandidateDetailResponse> {
  return withMockFallback(
    () =>
      postJson<CandidateDetailResponse, CandidateDetailRequest>(
        "/api/candidate-detail",
        payload,
        { timeoutMs: 90000 },
      ),
    () => mockCandidateDetail(payload),
  );
}

function mockRefineJobDescription(payload: RefineJDRequest): RefineJDResponse {
  const rawJD = payload.rawJD.trim();
  const roleTitle = inferRoleTitle(rawJD);

  return {
    refinedJD: [
      `${roleTitle} focused on delivering measurable customer and business outcomes.`,
      "The role requires clear ownership, strong collaboration with cross-functional partners, and evidence of shipping production-quality work.",
      payload.userComment?.instruction
        ? `Recruiter instruction applied: ${payload.userComment.instruction}.`
        : "The criteria below separate essential qualifications from helpful differentiators and potential hiring risks.",
    ].join("\n\n"),
    criteria: {
      mustHave: [
        "Has shipped production work that maps directly to customer or business outcomes.",
        "Can explain technical or product tradeoffs clearly to cross-functional partners.",
        "Shows evidence of ownership from ambiguous problem framing through delivery.",
      ],
      nice2Have: [
        "Experience with AI-assisted workflows, data-heavy products, or automation.",
        "Has worked with recruiters, hiring managers, or operational SaaS users.",
        "Can define measurable success metrics before implementation begins.",
      ],
      redFlags: [
        "Only describes tasks without outcomes, metrics, or user impact.",
        "Little evidence of adapting when requirements were ambiguous.",
        "Over-indexes on tools without explaining customer value.",
      ],
    },
    idealCandidateProfile:
      "A pragmatic builder who turns ambiguous needs into simple workflows, communicates tradeoffs clearly, and can prove impact with concrete outcomes.",
  };
}

function mockAnalyzeResumes(payload: AnalyzeResumesRequest): AnalyzeResumesResponse {
  const candidates = payload.resumes.map((resume, index) => {
    const score = scoreResume(resume.text, payload.criteria);
    const tier = getTier(score, index);
    const name = inferCandidateName(resume.filename, resume.text);

    return {
      id: resume.id,
      name,
      tier,
      summary: {
        consensus: buildConsensus(name, tier, score),
        conflicts:
          score.redFlagHits > 0
            ? "The resume has relevant signals, but potential red flags need recruiter follow-up."
            : "Reviewer perspectives are aligned; no major conflicts surfaced in the resume text.",
        interviewQuestions: [
          "Which project best demonstrates ownership from ambiguity to measurable outcome?",
          "What tradeoff would you make if speed, quality, and stakeholder alignment were in tension?",
          "How would you measure success in the first 90 days for this role?",
        ],
      },
    } satisfies Candidate;
  });

  return {
    candidates: candidates.sort((a, b) => tierRank(a.tier) - tierRank(b.tier)),
  };
}

function mockCandidateDetail(payload: CandidateDetailRequest): CandidateDetailResponse {
  const chunks = chunkResume(payload.resumeText);
  const mustHave = payload.criteria.mustHave[0] ?? "the top must-have criteria";
  const niceToHave = payload.criteria.nice2Have[0] ?? "helpful differentiators";
  const redFlag = payload.criteria.redFlags[0] ?? "potential risk areas";

  return {
    chunks,
    comments: chunks.flatMap((chunk, index) => [
      {
        chunkId: chunk.id,
        role: "recruiter" as const,
        type: index === 0 ? ("meets" as const) : ("unclear" as const),
        text:
          index === 0
            ? `This section gives a recruiter a useful starting point for screening against ${mustHave}.`
            : "This section should be probed for specificity, scope, and measurable outcomes.",
      },
      {
        chunkId: chunk.id,
        role: "hiringManager" as const,
        type: chunk.text.length > 500 ? ("meets" as const) : ("unclear" as const),
        text: `The hiring manager should validate depth of ownership and whether the examples map to ${niceToHave}.`,
      },
      {
        chunkId: chunk.id,
        role: "teamLead" as const,
        type: hasRiskLanguage(chunk.text) ? ("gap" as const) : ("meets" as const),
        text: hasRiskLanguage(chunk.text)
          ? `Potential gap: this text may indicate ${redFlag}. Ask for concrete examples and constraints.`
          : "The technical/team signal is reasonable, but the interview should still verify collaboration and execution details.",
      },
    ]),
  };
}

function inferRoleTitle(rawJD: string): string {
  const firstLine = rawJD.split("\n").find(Boolean)?.trim();
  return firstLine && firstLine.length < 80 ? firstLine : "Refined role";
}

function inferCandidateName(filename: string, text: string): string {
  const firstLine = text
    .split(/\n|\r/)
    .map((line) => line.trim())
    .find((line) => /^[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,3}$/.test(line));

  if (firstLine) {
    return firstLine;
  }

  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreResume(text: string, criteria: Criteria) {
  const normalizedText = text.toLowerCase();
  const mustHaveHits = countCriteriaHits(normalizedText, criteria.mustHave);
  const niceToHaveHits = countCriteriaHits(normalizedText, criteria.nice2Have);
  const redFlagHits = countCriteriaHits(normalizedText, criteria.redFlags);
  const outcomeSignals = countKeywordHits(normalizedText, [
    "launched",
    "shipped",
    "improved",
    "reduced",
    "increased",
    "revenue",
    "retention",
    "conversion",
    "customers",
    "users",
    "%",
  ]);

  return {
    mustHaveHits,
    niceToHaveHits,
    redFlagHits,
    outcomeSignals,
    total: mustHaveHits * 3 + niceToHaveHits + outcomeSignals - redFlagHits * 2,
  };
}

function countCriteriaHits(text: string, criteria: string[]): number {
  return criteria.filter((criterion) => {
    const keywords = criterion
      .toLowerCase()
      .split(/[^a-z0-9%]+/)
      .filter((word) => word.length > 4);
    return keywords.some((keyword) => text.includes(keyword));
  }).length;
}

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function getTier(score: ReturnType<typeof scoreResume>, index: number): CandidateTier {
  if (score.total >= 9 || (index === 0 && score.redFlagHits === 0)) {
    return "Strong Hire";
  }

  if (score.total >= 5) {
    return "Hire";
  }

  if (score.total >= 2) {
    return "Maybe";
  }

  return "No";
}

function tierRank(tier: CandidateTier): number {
  const ranks: Record<CandidateTier, number> = {
    "Strong Hire": 0,
    Hire: 1,
    Maybe: 2,
    No: 3,
  };

  return ranks[tier];
}

function buildConsensus(
  name: string,
  tier: CandidateTier,
  score: ReturnType<typeof scoreResume>,
): string {
  if (tier === "Strong Hire") {
    return `${name} shows strong alignment with the rubric, including ${score.mustHaveHits} must-have signal${score.mustHaveHits === 1 ? "" : "s"} and concrete outcome language.`;
  }

  if (tier === "Hire") {
    return `${name} appears qualified, with enough relevant evidence to advance while validating depth in interviews.`;
  }

  if (tier === "Maybe") {
    return `${name} has partial alignment, but the resume needs follow-up around missing criteria and measurable impact.`;
  }

  return `${name} does not show enough evidence against the current must-have criteria to prioritize in this slate.`;
}

function chunkResume(text: string): ResumeChunk[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const source = paragraphs.length >= 3 ? paragraphs : splitIntoWordChunks(text, 120);

  return source.slice(0, 6).map((chunk, index) => ({
    id: `chunk-${index + 1}`,
    text: chunk,
  }));
}

function splitIntoWordChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += wordsPerChunk) {
    chunks.push(words.slice(index, index + wordsPerChunk).join(" "));
  }

  return chunks.length > 0 ? chunks : ["No extractable resume text was available."];
}

function hasRiskLanguage(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ["gap", "unemployed", "terminated", "short tenure", "no experience"].some((term) =>
    lowerText.includes(term),
  );
}
