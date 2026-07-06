import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { CopyButton } from "@/components/copy-button";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { SyncScrimButton } from "@/components/sync-scrim-button";
import { prisma } from "@/lib/prisma";
import { safeJsonParse, formatDateTime } from "@/lib/utils";
import type { RiotMatch } from "@/lib/riot/types";

export const dynamic = "force-dynamic";

export default async function ScrimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scrim = await prisma.scrim.findUnique({
    where: { id: Number(id) },
    include: { participants: true },
  });

  if (!scrim) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <BackButton fallback="/scrims" />
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-red-100">내전을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const storedMatch = scrim.matchId ? await prisma.match.findUnique({ where: { matchId: scrim.matchId } }) : null;
  const match = safeJsonParse<RiotMatch | null>(storedMatch?.rawJson, null);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton fallback="/scrims" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/scrims" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            내전 목록
          </Link>
          <Link href="/scrims/new" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            새 내전
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{scrim.status}</p>
            <h1 className="mt-1 text-2xl font-black text-white">{scrim.title}</h1>
            <p className="mt-1 text-slate-400">{scrim.description ?? "설명 없음"}</p>
            <p className="mt-2 text-sm text-slate-500">{formatDateTime(scrim.scheduledAt)}</p>
          </div>
          <SyncScrimButton id={scrim.id} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Info label="Tournament Code" value={scrim.tournamentCode ?? "아직 없음"} copy={scrim.tournamentCode ?? undefined} />
          <Info label="Provider / Tournament" value={`${scrim.providerId ?? "-"} / ${scrim.tournamentId ?? "-"}`} />
          <Info label="Callback" value={scrim.callbackPayload ? "수신됨" : "대기 중"} />
          <Info label="Match ID" value={scrim.matchId ?? "아직 없음"} href={scrim.matchId ? `/matches/${scrim.matchId}` : undefined} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-white/10 bg-[#0d1320] p-5">
        <h2 className="font-black text-white">참가자</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {scrim.participants.map((participant) => (
            <div key={participant.id} className="rounded-lg border border-white/10 bg-black/15 p-3 text-sm">
              <p className="font-semibold text-white">
                {participant.gameName}#{participant.tagLine}
              </p>
              <p className="text-slate-400">{participant.teamName}</p>
            </div>
          ))}
        </div>
      </section>

      {match ? (
        <section className="mt-6">
          <MatchScoreboard match={match} />
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-white/10 bg-[#0d1320] p-5 text-sm text-slate-400">
          경기 결과가 아직 없습니다. callback이 오지 않았다면 수동 동기화를 사용하세요.
        </section>
      )}
    </main>
  );
}

function Info({ label, value, copy, href }: { label: string; value: string; copy?: string; href?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
      <p className="text-sm font-semibold text-slate-400">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        {href ? (
          <Link href={href} className="font-semibold text-cyan-200 hover:underline">
            {value}
          </Link>
        ) : (
          <p className="break-all font-semibold text-white">{value}</p>
        )}
        {copy ? <CopyButton value={copy} /> : null}
      </div>
    </div>
  );
}
