"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { refineJobDescription } from "@/lib/api";
import { useRecruitingStore } from "@/store/recruiting-store";

export default function UploadJDPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { rawJD: savedRawJD, setJobRefinement } = useRecruitingStore();
  const [rawJD, setRawJD] = useState(savedRawJD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedJD = rawJD.trim();

    if (!trimmedJD) {
      setError("Paste a job description before refining it.");
      return;
    }

    setIsLoading(true);

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
          <label htmlFor="rawJD" className="text-sm font-semibold text-zinc-950">
            Job description
          </label>
          <textarea
            id="rawJD"
            ref={textareaRef}
            value={rawJD}
            onChange={(event) => setRawJD(event.target.value)}
            rows={18}
            className="mt-3 min-h-[420px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Paste the vague job description here. Include responsibilities, seniority, team context, and any constraints you already know."
          />
        </section>

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
