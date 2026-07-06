export default function LoadingSummonerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 h-9 w-24 animate-pulse rounded-md bg-white/10" />
      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 animate-pulse rounded-lg bg-white/10" />
          <div className="flex-1">
            <div className="h-3 w-32 animate-pulse rounded bg-cyan-300/20" />
            <div className="mt-3 h-8 w-64 max-w-full animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-44 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="h-24 animate-pulse rounded-lg border border-white/10 bg-black/15" />
          <div className="h-24 animate-pulse rounded-lg border border-white/10 bg-black/15" />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg border border-white/10 bg-black/15" />
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-white/10 bg-[#0d1320]" />
        ))}
      </section>
    </main>
  );
}
