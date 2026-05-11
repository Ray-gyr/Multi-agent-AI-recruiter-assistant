"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { TierBadge } from "@/components/TierBadge";
import { getCandidateDetail } from "@/lib/api";
import { useRecruitingStore } from "@/store/recruiting-store";
import type {
  CandidateComment,
  CandidateCommentRole,
  CandidateCommentType,
} from "@/types";

const roles: CandidateCommentRole[] = ["recruiter", "hiringManager", "teamLead"];

const roleLabels: Record<CandidateCommentRole, string> = {
  recruiter: "Recruiter",
  hiringManager: "Hiring manager",
  teamLead: "Tech lead",
};

const commentTypeStyles: Record<CandidateCommentType, string> = {
  meets: "border-emerald-200 bg-emerald-50 text-emerald-800",
  unclear: "border-amber-200 bg-amber-50 text-amber-900",
  gap: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const candidateId = Number.parseInt(decodeURIComponent(params.id), 10);
  const hasValidCandidateId = Number.isFinite(candidateId);
  const {
    candidates,
    criteria,
    resumeTexts,
    selectedCandidateDetail,
    candidateDetails,
    setCandidateDetail,
  } = useRecruitingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const candidate = hasValidCandidateId
    ? candidates.find((item) => item.id === candidateId)
    : undefined;
  const resumeText = hasValidCandidateId ? resumeTexts[String(candidateId)] : undefined;
  const cachedDetail =
    (hasValidCandidateId ? candidateDetails[String(candidateId)] : undefined) ??
    (selectedCandidateDetail?.candidateId === candidateId ? selectedCandidateDetail : null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!hasValidCandidateId || !criteria || !resumeText || cachedDetail) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const detail = await getCandidateDetail({
          candidateID: candidateId,
          resumeText,
          criteria,
        });

        if (isMounted) {
          setCandidateDetail(candidateId, detail);
        }
      } catch (detailError) {
        if (isMounted) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "The candidate detail service did not respond.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [cachedDetail, candidateId, criteria, hasValidCandidateId, resumeText, setCandidateDetail]);

  const commentsByChunk = useMemo(() => {
    const grouped: Record<number, CandidateComment[]> = {};

    for (const comment of cachedDetail?.comments ?? []) {
      grouped[comment.chunkId] = [...(grouped[comment.chunkId] ?? []), comment];
    }

    return grouped;
  }, [cachedDetail]);

  if (!candidate || !criteria || !resumeText) {
    return (
      <EmptyState
        title="Candidate context is unavailable"
        description="Candidate drill-downs use the ranked candidate list and cached resume text from the upload step. Return to results or rerun the analysis."
        actionHref="/results"
        actionLabel="Back to results"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Candidate drill-down"
        title={candidate.name}
        description={candidate.summary.consensus}
        actions={
          <Link
            href="/results"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Back to results
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">Tier</p>
          <div className="mt-3">
            <TierBadge tier={candidate.tier} />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">Conflicts</p>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            {candidate.summary.conflicts || "No major reviewer conflicts surfaced."}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">Overview</p>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            {cachedDetail?.summary.overview ??
              "Detailed overview will appear after the candidate analysis loads."}
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-950">
          Loading resume chunks and multi-role feedback...
        </div>
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      {cachedDetail ? (
        <>
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Interview questions</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
              {cachedDetail.summary.interviewQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            {cachedDetail.chunks.map((chunk, index) => {
              const chunkComments = commentsByChunk[chunk.id] ?? [];

              return (
                <article
                  key={chunk.id}
                  className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
                        Resume chunk {index + 1}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                        Chunk {chunk.id}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                    {chunk.text}
                  </p>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {roles.map((role) => (
                      <div
                        key={role}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <h3 className="font-semibold text-zinc-950">{roleLabels[role]}</h3>
                        <div className="mt-3 space-y-3">
                          {chunkComments
                            .filter((comment) => comment.role === role)
                            .map((comment) => (
                              <div key={`${comment.role}-${comment.type}-${comment.text}`}>
                                <span
                                  className={[
                                    "inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-bold capitalize",
                                    commentTypeStyles[comment.type],
                                  ].join(" ")}
                                >
                                  {comment.type}
                                </span>
                                <p className="mt-2 text-sm leading-6 text-zinc-700">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          {chunkComments.filter((comment) => comment.role === role).length ===
                          0 ? (
                            <p className="text-sm leading-6 text-zinc-500">
                              No comment from this role for the chunk.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </div>
  );
}
