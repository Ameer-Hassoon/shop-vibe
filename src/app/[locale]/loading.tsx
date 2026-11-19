export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" role="status" aria-busy="true">
      <div className="mb-8 h-8 w-56 animate-pulse rounded bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
