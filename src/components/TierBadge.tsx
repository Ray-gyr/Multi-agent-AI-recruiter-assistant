import type { CandidateTier } from "@/types";

const tierStyles: Record<CandidateTier, string> = {
  "Strong Hire": "border-emerald-200 bg-emerald-50 text-emerald-800",
  Hire: "border-sky-200 bg-sky-50 text-sky-800",
  Maybe: "border-amber-200 bg-amber-50 text-amber-900",
  No: "border-rose-200 bg-rose-50 text-rose-800",
};

export function TierBadge({ tier }: { tier: CandidateTier }) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-bold",
        tierStyles[tier],
      ].join(" ")}
    >
      {tier}
    </span>
  );
}
