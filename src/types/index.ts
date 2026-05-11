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
  previousRefinedJD?: string;
  userComments?: UserComment[];
};

export type RefineJDResponse = {
  refinedJD: string;
  criteria: Criteria;
  idealCandidateProfile: string;
};

export type ResumeInput = {
  id: number;
  filename: string;
  text: string;
};

export type ResumeRecord = {
  id: number;
  filename: string;
  uploadedAt: string;
  wordCount: number;
  fileSize: number;
};

export type CandidateTier = "Strong Hire" | "Hire" | "Maybe" | "No";

export type CandidateSummary = {
  consensus: string;
  conflicts: string;
};

export type Candidate = {
  id: number;
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
  candidateId: number;
  resumeText: string;
  criteria: Criteria;
};

export type CandidateCommentRole = "recruiter" | "hiringManager" | "teamLead";

export type CandidateCommentType = "meets" | "unclear" | "gap";

export type CandidateComment = {
  quote: string;
  role: CandidateCommentRole;
  type: CandidateCommentType;
  text: string;
};

export type CandidateDetailSummary = {
  overview: string;
  interviewQuestions: string[];
};

export type CandidateDetailResponse = {
  comments: CandidateComment[];
  summary: CandidateDetailSummary;
};

export type CandidateDetail = CandidateDetailResponse & {
  candidateId: number;
};
