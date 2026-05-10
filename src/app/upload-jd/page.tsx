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
  const [selectedText, setSelectedText] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedJD = rawJD.trim();
    const trimmedInstruction = instruction.trim();

    if (!trimmedJD) {
      setError("Paste a job description before refining it.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await refineJobDescription({
        rawJD: trimmedJD,
        userComment: trimmedInstruction
          ? {
              selectedText: selectedText.trim() || trimmedJD,
              instruction: trimmedInstruction,
            }
          : undefined,
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

  function captureSelection() {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    const selection = element.value.slice(element.selectionStart, element.selectionEnd).trim();
    setSelectedText(selection);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 1"
        title="Refine the job description"
        description="Paste the rough role description. The assistant will turn it into recruiter-ready hiring criteria and an ideal candidate profile."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label htmlFor="rawJD" className="text-sm font-semibold text-zinc-950">
            Job description
          </label>
          <textarea
            id="rawJD"
            ref={textareaRef}
            value={rawJD}
            onChange={(event) => setRawJD(event.target.value)}
            onSelect={captureSelection}
            rows={18}
            className="mt-3 min-h-[420px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Paste the vague job description here. Include responsibilities, seniority, team context, and any constraints you already know."
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <label htmlFor="instruction" className="text-sm font-semibold text-zinc-950">
              Optional edit instruction
            </label>
            <input
              id="instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              className="mt-3 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="Example: prioritize platform experience"
            />
            <div className="mt-4 rounded-lg bg-zinc-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Selected text
              </p>
              <p className="mt-2 max-h-36 overflow-auto text-sm leading-6 text-zinc-600">
                {selectedText ||
                  "Highlight text in the job description to target the instruction, or leave it blank to apply the instruction to the full job description."}
              </p>
            </div>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isLoading ? "Refining Job Description..." : "Refine Job Description"}
          </button>
        </aside>
      </form>
    </div>
  );
}
