export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" role="status" aria-busy="true">
      <div className="mb-6 h-5 w-64 max-w-full animate-pulse rounded bg-surface-2" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-square animate-pulse rounded-[var(--radius-card)] bg-surface-2 sm:aspect-[4/3] lg:aspect-[4/5]" />
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-surface-2" />
          <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
          <div className="h-9 w-32 animate-pulse rounded bg-surface-2" />
          <div className="h-24 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-12 w-full animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
