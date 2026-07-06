export function PageLoading({
  title = "불러오는 중",
  variant = "list",
}: {
  title?: string;
  variant?: "home" | "detail" | "list" | "form";
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 h-9 w-24 animate-pulse rounded-md bg-white/10" />
      {variant === "home" ? <HomeSkeleton title={title} /> : null}
      {variant === "detail" ? <DetailSkeleton title={title} /> : null}
      {variant === "list" ? <ListSkeleton title={title} /> : null}
      {variant === "form" ? <FormSkeleton title={title} /> : null}
    </main>
  );
}

function HeaderSkeleton({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">{title}</p>
      <div className="mt-2 h-8 w-64 max-w-full animate-pulse rounded bg-white/10" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-white/10" />
    </div>
  );
}

function HomeSkeleton({ title }: { title: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <HeaderSkeleton title={title} />
        <div className="h-12 animate-pulse rounded-md bg-black/20" />
      </section>
      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg border border-white/10 bg-black/15" />
          ))}
        </div>
      </section>
    </div>
  );
}

function DetailSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <HeaderSkeleton title={title} />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg border border-white/10 bg-black/15" />
          ))}
        </div>
      </section>
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="rounded-lg border border-white/10 bg-[#0d1320] p-4">
          <div className="h-8 animate-pulse rounded bg-white/10" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((__, rowIndex) => (
              <div key={rowIndex} className="h-16 animate-pulse rounded bg-white/[0.04]" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ListSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
      <HeaderSkeleton title={title} />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-white/10 bg-black/15" />
        ))}
      </div>
    </section>
  );
}

function FormSkeleton({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-[#0d1320] p-5">
      <HeaderSkeleton title={title} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-12 animate-pulse rounded-md bg-black/20" />
        <div className="h-12 animate-pulse rounded-md bg-black/20" />
      </div>
      <div className="mt-4 h-28 animate-pulse rounded-md bg-black/20" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-black/15" />
        <div className="h-48 animate-pulse rounded-lg border border-white/10 bg-black/15" />
      </div>
    </section>
  );
}
