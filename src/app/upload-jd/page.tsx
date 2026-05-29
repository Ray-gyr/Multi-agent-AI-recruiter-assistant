"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingStages } from "@/components/LoadingStages";
import { PageHeader } from "@/components/PageHeader";
import { refineJobDescription } from "@/lib/api";
import { useRecruitingStore } from "@/store/recruiting-store";

const refinementStages = [
  "Reading raw description",
  "Analyzing key requirements",
  "Structuring hiring criteria",
  "Generating ideal candidate profile",
];

export default function UploadJDPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { rawJD: savedRawJD, setJobRefinement } = useRecruitingStore();
  const [rawJD, setRawJD] = useState(savedRawJD);
  const [isLoading, setIsLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState("");

  const handleInjectExample = () => {
    setRawJD(
      `Job Title: Full Stack Developer (Growth Team)
Company: TechFlow Solutions
About the Role: We are looking for a dev to join our growth team. We need someone who can move fast and break things. You will work on our main platform and help us get more users.
Requirements:
•\tSome experience with React and Node.js.
•\tGood at solving problems.
•\tAble to work in a team.
•\tExperience with databases like PostgreSQL.
•\t1+ years of exp
•\tWork remote
•\tCloud service:aws
intern`
    );
  };

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = setInterval(() => {
      setStageIndex((currentStage) => Math.min(currentStage + 1, 3));
    }, 2500);

    return () => clearInterval(timer);
  }, [isLoading]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedJD = rawJD.trim();

    if (!trimmedJD) {
      setError("Paste a job description before refining it.");
      return;
    }

    setIsLoading(true);
    setStageIndex(0);

    try {
      const response = await refineJobDescription({
        rawJD: trimmedJD,
      });

      setJobRefinement({
        rawJD: trimmedJD,
        refinedJD: response.refinedJD,
        criteria: response.criteria,
        idealCandidateProfile: response.idealCandidateProfile,
      });
      router.push("/review-criteria");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The Job Description refinement service did not respond.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 1"
        title="Refine the job description"
        description="Paste the rough role description. The assistant will turn it into recruiter-ready hiring criteria and an ideal candidate profile."
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="rawJD" className="text-sm font-semibold text-zinc-950">
              Job description
            </label>
            <button
              type="button"
              onClick={handleInjectExample}
              disabled={isLoading}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition disabled:opacity-50 disabled:no-underline"
            >
              Inject JD Example
            </button>
          </div>
          <textarea
            id="rawJD"
            ref={textareaRef}
            value={rawJD}
            onChange={(event) => setRawJD(event.target.value)}
            rows={18}
            disabled={isLoading}
            className="mt-3 min-h-[420px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed"
            placeholder="Paste the vague job description here. Include responsibilities, seniority, team context, and any constraints you already know."
          />
        </section>

        {isLoading ? (
          <LoadingStages activeIndex={stageIndex} stages={refinementStages} />
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isLoading ? "Refining Job Description..." : "Refine Job Description"}
        </button>
      </form>
    </div>
  );
}
