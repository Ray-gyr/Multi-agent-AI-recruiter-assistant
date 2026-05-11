"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CriteriaEditor } from "@/components/CriteriaEditor";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { useRecruitingStore } from "@/store/recruiting-store";
import type { Criteria } from "@/types";

const emptyCriteria: Criteria = {
  mustHave: [],
  nice2Have: [],
  redFlags: [],
};

export default function ReviewCriteriaPage() {
  const router = useRouter();
  const { criteria, refinedJD, idealCandidateProfile, updateCriteria } = useRecruitingStore();
  const [draft, setDraft] = useState<Criteria>(criteria ?? emptyCriteria);
  const [error, setError] = useState("");

  useEffect(() => {
    if (criteria) {
      setDraft(criteria);
    }
  }, [criteria]);

  if (!criteria) {
    return (
      <EmptyState
        title="No criteria to review yet"
        description="Refine a job description first so the assistant can produce structured must-haves, nice-to-haves, and red flags."
        actionHref="/upload-jd"
        actionLabel="Upload job description"
      />
    );
  }

  function handleConfirm() {
    const cleanedCriteria = cleanCriteria(draft);

    if (
      cleanedCriteria.mustHave.length === 0 &&
      cleanedCriteria.nice2Have.length === 0 &&
      cleanedCriteria.redFlags.length === 0
    ) {
      setError("Keep at least one criterion before moving to resume upload.");
      return;
    }

    updateCriteria(cleanedCriteria);
    router.push("/upload-resumes");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 2"
        title="Review hiring criteria"
        description="Edit the AI-refined criteria before they become the rubric used to rank resumes."
        actions={
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Confirm criteria
          </button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Refined Job Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{refinedJD}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Ideal candidate profile</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">{idealCandidateProfile}</p>
        </div>
      </section>

      <CriteriaEditor criteria={draft} onChange={setDraft} />
    </div>
  );
}

function cleanCriteria(criteria: Criteria): Criteria {
  return {
    mustHave: criteria.mustHave.map((item) => item.trim()).filter(Boolean),
    nice2Have: criteria.nice2Have.map((item) => item.trim()).filter(Boolean),
    redFlags: criteria.redFlags.map((item) => item.trim()).filter(Boolean),
  };
}
