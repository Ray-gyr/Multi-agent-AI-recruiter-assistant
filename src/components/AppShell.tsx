"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRecruitingStore } from "@/store/recruiting-store";

const steps = [
  { label: "Job description", href: "/upload-jd" },
  { label: "Criteria", href: "/review-criteria" },
  { label: "Resumes", href: "/upload-resumes" },
  { label: "Results", href: "/results" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { criteria, resumes, candidates, resetWorkflow, rawJD } = useRecruitingStore();
  const hasWorkflowState = Boolean(criteria) || resumes.length > 0 || candidates.length > 0 || Boolean(rawJD);

  function handleStartOver() {
    if (
      hasWorkflowState &&
      !window.confirm("Start over and clear the current job description, criteria, resumes, and results?")
    ) {
      return;
    }

    resetWorkflow();
    router.push("/upload-jd");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-zinc-900">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/upload-jd" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-sm font-black text-white">
                SL
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  SLATE
                </p>
                <p className="text-lg font-semibold text-zinc-950">Recruiter Assistant</p>
              </div>
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-normal text-zinc-600">
                {candidates.length > 0
                  ? `${candidates.length} candidates ranked`
                  : resumes.length > 0
                    ? `${resumes.length} resumes cached`
                    : criteria
                      ? "Criteria ready"
                      : "Start with a rough job description"}
              </div>
              <button
                type="button"
                onClick={handleStartOver}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                Start Over
              </button>
            </div>
          </div>
          <nav aria-label="Workflow" className="flex gap-2 overflow-x-auto pb-1">
            {steps.map((step, index) => {
              const active =
                pathname === step.href ||
                (pathname?.startsWith("/candidate/") && step.href === "/results");
              const complete = isStepComplete(index, {
                hasCriteria: Boolean(criteria),
                hasResumes: resumes.length > 0,
                hasCandidates: candidates.length > 0,
              });

              const isLocked = index > 0 && !rawJD;

              return (
                <Link
                  key={step.href}
                  href={isLocked ? "#" : step.href}
                  onClick={(e) => isLocked && e.preventDefault()}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                    active
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    isLocked ? "pointer-events-none opacity-50" : ""
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-6 place-items-center rounded-full text-xs",
                      active
                        ? "bg-white text-emerald-700"
                        : complete
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-500",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  {step.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function isStepComplete(
  index: number,
  state: { hasCriteria: boolean; hasResumes: boolean; hasCandidates: boolean },
) {
  if (index === 0) {
    return state.hasCriteria;
  }

  if (index === 1) {
    return state.hasCriteria;
  }

  if (index === 2) {
    return state.hasResumes;
  }

  return state.hasCandidates;
}
