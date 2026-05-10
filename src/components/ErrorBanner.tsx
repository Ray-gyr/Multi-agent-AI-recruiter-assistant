export function ErrorBanner({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
    </div>
  );
}
