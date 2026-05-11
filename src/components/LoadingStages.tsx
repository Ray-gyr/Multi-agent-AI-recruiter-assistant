const defaultStages = [
  "Extracting resumes",
  "Running AI evaluation",
  "Generating recruiter insights",
  "Finalizing ranking",
];

export function LoadingStages({
  activeIndex,
  stages = defaultStages,
}: {
  activeIndex: number;
  stages?: string[];
}) {
  const progress = ((Math.min(activeIndex, stages.length - 1) + 1) / stages.length) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-emerald-950">{stages[activeIndex] ?? stages[0]}</p>
        <p className="text-sm font-medium text-emerald-800">
          Step {Math.min(activeIndex + 1, stages.length)} of {stages.length}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-700 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-4">
        {stages.map((stage, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li
              key={stage}
              className={[
                "rounded-md border px-3 py-2 text-sm font-medium",
                active
                  ? "border-emerald-700 bg-white text-emerald-900"
                  : complete
                    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                    : "border-emerald-100 bg-white/70 text-zinc-500",
              ].join(" ")}
            >
              {stage}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
