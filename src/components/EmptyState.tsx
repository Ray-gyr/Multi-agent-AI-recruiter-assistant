import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
