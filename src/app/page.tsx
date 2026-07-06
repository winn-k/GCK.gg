import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { prisma } from "@/lib/prisma";
import { getDDragonVersion, profileIconUrl } from "@/lib/riot/ddragon";
import { seedDemoScrimIfEmpty } from "@/lib/services/scrims";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  await seedDemoScrimIfEmpty();
  const [recentSummoners, recentScrims, version] = await Promise.all([
    prisma.summoner.findMany({ orderBy: { updatedAt: "desc" }, take: 3 }),
    prisma.scrim.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
    getDDragonVersion(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">KR Server</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">친구들 전적과 내전 기록</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Riot ID로 검색하고, 내전은 Tournament Code와 callback으로 기록합니다.</p>
          </div>
          <SearchBox />
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">최근 검색</h2>
            <span className="text-xs text-slate-500">3분 갱신 제한</span>
          </div>
          <div className="mt-4 space-y-3">
            {recentSummoners.length ? (
              recentSummoners.map((summoner) => (
                <Link
                  key={summoner.puuid}
                  href={`/summoners/kr/${encodeURIComponent(summoner.gameName)}/${encodeURIComponent(summoner.tagLine)}`}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/15 p-3 transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
                >
                  <img src={profileIconUrl(summoner.profileIconId, version)} alt="" className="h-10 w-10 rounded-md border border-white/10" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {summoner.gameName}#{summoner.tagLine}
                    </p>
                    <p className="text-xs text-slate-500">Lv.{summoner.summonerLevel ?? "-"} · {formatDateTime(summoner.updatedAt)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-white/10 bg-black/15 p-3 text-sm text-slate-400">아직 검색 기록이 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white">최근 내전</h2>
            <p className="text-sm text-slate-400">코드 발급, callback 상태, 경기 결과를 한 화면에서 확인합니다.</p>
          </div>
          <Link href="/scrims/new" className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200">
            내전 생성
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentScrims.map((scrim) => (
            <Link key={scrim.id} href={`/scrims/${scrim.id}`} className="rounded-lg border border-white/10 bg-black/15 p-4 transition hover:border-cyan-400/50 hover:bg-cyan-400/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-white">{scrim.title}</h3>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-300">{scrim.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{scrim.description ?? "설명 없음"}</p>
              <p className="mt-3 text-xs text-slate-500">{formatDateTime(scrim.scheduledAt)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
