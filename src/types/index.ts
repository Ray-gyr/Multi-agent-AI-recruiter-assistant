export type Criteria = {
  mustHave: string[];
  nice2Have: string[];
  redFlags: string[];
};

export type CriteriaKey = keyof Criteria;

export type UserComment = {
  selectedText: string;
  instruction: string;
};

export type RefineJDRequest = {
  rawJD: string;
  userComment?: UserComment;
};

export type RefineJDResponse = {
  refinedJD: string;
  criteria: Criteria;
  idealCandidateProfile: string;
};

export type ResumeInput = {
  id: string;
  filename: string;
  text: string;
};

export type ResumeRecord = {
  id: string;
  filename: string;
  uploadedAt: string;
  wordCount: number;
  fileSize: number;
};

export type CandidateTier = "Strong Hire" | "Hire" | "Maybe" | "No";

export type CandidateSummary = {
  consensus: string;
  conflicts: string;
  interviewQuestions: string[];
};

export type Candidate = {
  id: string;
  name: string;
  tier: CandidateTier;
  summary: CandidateSummary;
};

export type AnalyzeResumesRequest = {
  criteria: Criteria;
  idealCandidateProfile: string;
  resumes: ResumeInput[];
};

export type AnalyzeResumesResponse = {
  candidates: Candidate[];
};

export type CandidateDetailRequest = {
  candidateId: string;
  resumeText: string;
  criteria: Criteria;
};

export type ResumeChunk = {
  id: string;
  text: string;
};

export type CandidateCommentRole = "recruiter" | "hiringManager" | "teamLead";

export type CandidateCommentType = "meets" | "unclear" | "gap";

export type CandidateComment = {
  chunkId: string;
  role: CandidateCommentRole;
  type: CandidateCommentType;
  text: string;
};

export type CandidateDetailResponse = {
  chunks: ResumeChunk[];
  comments: CandidateComment[];
};

export type CandidateDetail = CandidateDetailResponse & {
  candidateId: string;
};
