import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { riotErrorMessage } from "@/lib/riot/errors";
import { getStoredOrFetchedMatch } from "@/lib/services/matches";
import { safeJsonParse } from "@/lib/utils";
import type { RiotMatch } from "@/lib/riot/types";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const result = await loadMatch(decodeURIComponent(matchId));
  if ("error" in result) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{riotErrorMessage(result.error)}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton fallback="/" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            검색
          </Link>
          <Link href="/scrims" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            내전 목록
          </Link>
        </div>
      </div>
      <MatchScoreboard match={result.match} />
    </main>
  );
}

async function loadMatch(matchId: string): Promise<{ match: RiotMatch } | { error: unknown }> {
  try {
    const stored = await getStoredOrFetchedMatch(matchId);
    const match = safeJsonParse<RiotMatch | null>(stored.rawJson, null);
    if (!match) throw new Error("저장된 match JSON을 읽을 수 없습니다.");
    return { match };
  } catch (error) {
    return { error };
  }
}
