import type {
  AnalyzeResumesRequest,
  AnalyzeResumesResponse,
  CandidateDetailRequest,
  CandidateDetailResponse,
  RefineJDRequest,
  RefineJDResponse,
} from "@/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

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

export function refineJobDescription(payload: RefineJDRequest): Promise<RefineJDResponse> {
  return postJson<RefineJDResponse, RefineJDRequest>("/api/jd/refine", payload, {
    timeoutMs: 180000,
  });
}

export function analyzeResumes(
  payload: AnalyzeResumesRequest,
): Promise<AnalyzeResumesResponse> {
  return postJson<AnalyzeResumesResponse, AnalyzeResumesRequest>(
    "/api/analyze-resumes",
    payload,
    { timeoutMs: 180000 },
  );
}

export function getCandidateDetail(
  payload: CandidateDetailRequest,
): Promise<CandidateDetailResponse> {
  return postJson<CandidateDetailResponse, CandidateDetailRequest>(
    "/api/candidate-detail",
    payload,
    { timeoutMs: 90000 },
  );
}
