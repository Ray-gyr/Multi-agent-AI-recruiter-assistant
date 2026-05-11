import Link from "next/link";
import type { Candidate, CandidateTier } from "@/types";
import { TierBadge } from "@/components/TierBadge";

const tierRank: Record<CandidateTier, number> = {
  "Strong Hire": 0,
  Hire: 1,
  Maybe: 2,
  No: 3,
};

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const sortedCandidates = [...candidates].sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Summary preview
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                Drill-down
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedCandidates.map((candidate) => (
              <tr key={candidate.id} className="transition hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-zinc-950">
                  {candidate.name}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <TierBadge tier={candidate.tier} />
                </td>
                <td className="max-w-2xl px-4 py-4 text-sm leading-6 text-zinc-600">
                  {candidate.summary.consensus}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <Link
                    href={`/candidate/${encodeURIComponent(candidate.id)}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Open profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
