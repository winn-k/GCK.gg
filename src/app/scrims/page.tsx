import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { prisma } from "@/lib/prisma";
import { seedDemoScrimIfEmpty } from "@/lib/services/scrims";

export const dynamic = "force-dynamic";

export default async function ScrimsPage() {
  await seedDemoScrimIfEmpty();
  const scrims = await prisma.scrim.findMany({ orderBy: { updatedAt: "desc" }, include: { participants: true } });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-black text-white">학교 내전</h1>
            <p className="text-sm text-slate-400">Tournament Code로 만든 사용자 지정 게임 기록입니다.</p>
          </div>
        </div>
        <Link href="/scrims/new" className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200">
          새 내전
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {scrims.map((scrim) => (
          <Link
            key={scrim.id}
            href={`/scrims/${scrim.id}`}
            className="rounded-lg border border-white/10 bg-[#0d1320] p-4 transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-white">{scrim.title}</h2>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-300">{scrim.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {scrim.tournamentCode ? `코드 발급됨 · ${scrim.tournamentCode}` : "Tournament Code 발급 대기"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{scrim.matchId ? `경기 결과 ${scrim.matchId}` : "경기 결과 대기 중"}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
