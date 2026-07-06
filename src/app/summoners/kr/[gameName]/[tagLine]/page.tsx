import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { MatchSyncStatus } from "@/components/match-sync-status";
import { PositionBadge } from "@/components/position-badge";
import { RefreshButton } from "@/components/refresh-button";
import { queueNames } from "@/lib/constants";
import { analyzeMatch, normalizePosition, positionLabel, summarizeRecentMatches } from "@/lib/analytics/match";
import { getDDragonVersion, profileIconUrl } from "@/lib/riot/ddragon";
import { riotErrorMessage } from "@/lib/riot/errors";
import { getSummonerPageData } from "@/lib/services/summoners";
import { safeJsonParse } from "@/lib/utils";
import type { RiotMatch, RiotParticipant } from "@/lib/riot/types";

export const dynamic = "force-dynamic";

export default async function SummonerPage({ params }: { params: Promise<{ gameName: string; tagLine: string }> }) {
  const { gameName, tagLine } = await params;
  const result = await loadSummoner(gameName, tagLine);

  if ("error" in result) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-5">
          <h1 className="text-xl font-black text-red-100">검색 실패</h1>
          <p className="mt-2 text-red-200">{riotErrorMessage(result.error)}</p>
          <Link href="/" className="mt-4 inline-block rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">
            돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const { summoner, matches, matchIds, missingMatchIds, cooldownUntil, version } = result;
  const parsedMatches = matches
    .map((storedMatch) => safeJsonParse<RiotMatch | null>(storedMatch.rawJson, null))
    .filter((match): match is RiotMatch => Boolean(match));
  const recent = summarizeRecentMatches(parsedMatches, summoner.puuid);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton fallback="/" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            새 검색
          </Link>
          <Link href="/scrims" className="rounded-md border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">
            내전
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={profileIconUrl(summoner.profileIconId, version)} alt="" className="h-20 w-20 rounded-lg border border-white/10" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">KR Solo Queue</p>
              <h1 className="mt-1 text-3xl font-black text-white">
                {summoner.gameName}#{summoner.tagLine}
              </h1>
              <p className="text-slate-400">레벨 {summoner.summonerLevel ?? "-"} · PUUID 기반 캐시</p>
            </div>
          </div>
          <RefreshButton puuid={summoner.puuid} disabledUntil={cooldownUntil} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {summoner.ranks.length ? (
            summoner.ranks.map((rank) => (
              <div key={rank.id} className="rounded-lg border border-white/10 bg-black/15 p-4">
                <p className="text-sm font-semibold text-slate-400">
                  {rank.queueType === "RANKED_SOLO_5x5" ? "솔로랭크" : "자유랭크"}
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {rank.tier} {rank.rank} · {rank.leaguePoints} LP
                </p>
                <p className="text-sm text-slate-400">
                  {rank.wins}승 {rank.losses}패
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-white/10 bg-black/15 p-4 text-sm text-slate-400">랭크 정보가 없습니다.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">최근 {matchIds.length || recent.games}경기 폼</h2>
            <p className="text-sm text-slate-400">프로필은 먼저 보여주고, 경기 상세 분석은 캐시와 백그라운드 동기화로 채웁니다.</p>
          </div>
          {recent.bestPosition ? <PositionBadge position={recent.bestPosition.name} /> : null}
        </div>

        <div className="mt-4">
          <MatchSyncStatus puuid={summoner.puuid} missingCount={missingMatchIds.length} totalCount={matchIds.length || 12} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard label="승률" value={`${recent.winRate}%`} sub={`${recent.wins}승 ${recent.games - recent.wins}패`} tone={recent.winRate >= 50 ? "blue" : "red"} />
          <SummaryCard label="평균 KDA" value={recent.avgKda.toFixed(1)} sub="킬/데스/어시스트" />
          <SummaryCard label="킬관여율" value={`${recent.avgKillParticipation}%`} sub="팀 킬 기여" />
          <SummaryCard label="CS/min" value={recent.avgCsPerMinute.toFixed(1)} sub="라인 성장" />
          <SummaryCard label="딜비중" value={`${recent.avgDamageShare}%`} sub="팀 내 챔피언 딜" />
          <SummaryCard label="시야/min" value={recent.avgVisionPerMinute.toFixed(1)} sub="와드/시야 장악" />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-white">최근 픽</h3>
              <span className="text-xs font-semibold text-slate-500">최다 사용 챔피언</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {recent.championStats.slice(0, 3).map((stat) => (
                <div key={stat.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <img src={championImageUrl(stat.name, version)} alt={stat.name} className="h-11 w-11 rounded-md border border-white/10" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{stat.name}</p>
                    <p className="text-xs text-slate-400">
                      {stat.games}게임 · 승률 {stat.winRate}%
                    </p>
                  </div>
                </div>
              ))}
              {!recent.championStats.length ? <p className="text-sm text-slate-500">분석할 경기 상세를 가져오는 중입니다.</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-white">포지션 흐름</h3>
              {recent.bestPosition ? <span className="text-xs font-semibold text-cyan-200">최고 승률 {positionLabel(recent.bestPosition.name)}</span> : null}
            </div>
            <div className="mt-3 space-y-2">
              {recent.positionStats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <PositionBadge position={stat.name} compact />
                  <span className="text-sm font-semibold text-slate-300">
                    {stat.games}게임 · {stat.winRate}%
                  </span>
                </div>
              ))}
              {!recent.positionStats.length ? <p className="text-sm text-slate-500">경기 분석이 채워지면 표시됩니다.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-xl font-black text-white">최근 경기</h2>
        {parsedMatches.map((match) => {
          const participant = match.info.participants.find((item) => item.puuid === summoner.puuid);
          if (!participant) return null;
          const team = match.info.participants.filter((item) => item.teamId === participant.teamId);
          const teamKills = team.reduce((sum, item) => sum + item.kills, 0);
          const kp = Math.round(((participant.kills + participant.assists) / Math.max(teamKills, 1)) * 100);
          const playerRank = analyzeMatch(match).players.findIndex((row) => row.participant.puuid === summoner.puuid) + 1;
          const teamLuck = getTeamLuck(participant.win, playerRank);

          return (
            <RecentMatchCard
              key={match.metadata.matchId}
              matchId={match.metadata.matchId}
              queueId={match.info.queueId}
              participant={participant}
              kp={kp}
              playerRank={playerRank}
              teamLuck={teamLuck}
              version={version}
            />
          );
        })}
        {!parsedMatches.length ? (
          <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5 text-sm text-slate-400">
            최근 경기 목록을 먼저 확인했습니다. 상세 분석은 잠시 뒤 자동으로 채워집니다.
          </div>
        ) : null}
      </section>
    </main>
  );
}

async function loadSummoner(gameName: string, tagLine: string) {
  try {
    const [{ summoner, matches, matchIds, missingMatchIds, cooldownUntil }, version] = await Promise.all([
      getSummonerPageData(gameName, tagLine),
      getDDragonVersion(),
    ]);
    return { summoner, matches, matchIds, missingMatchIds, cooldownUntil, version };
  } catch (error) {
    return { error };
  }
}

function RecentMatchCard({
  matchId,
  queueId,
  participant,
  kp,
  playerRank,
  teamLuck,
  version,
}: {
  matchId: string;
  queueId: number | null;
  participant: RiotParticipant;
  kp: number;
  playerRank: number;
  teamLuck: { label: string; className: string };
  version: string;
}) {
  const championName = participant.championName;
  const position = normalizePosition(participant);
  const cs = participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const isTopThree = playerRank > 0 && playerRank <= 3;
  const cardClass = getRecentMatchCardClass(participant.win, isTopThree);

  return (
    <Link href={`/matches/${matchId}`} className={`block rounded-lg border p-4 transition hover:border-cyan-300/60 ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={championImageUrl(championName, version)} alt={championName} className="h-14 w-14 rounded-md border border-white/10" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black text-white">{championName}</h3>
              <PositionBadge position={position} compact />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-400">{queueNames[queueId ?? 0] ?? queueId}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs sm:min-w-[360px]">
          <SmallStat label="KDA" value={`${participant.kills}/${participant.deaths}/${participant.assists}`} />
          <SmallStat label="KP" value={`${kp}%`} />
          <SmallStat label="CS" value={String(cs)} />
          <SmallStat label="시야" value={String(participant.visionScore)} />
        </div>

        <div className="min-w-[92px] text-right text-sm font-black">
          {isTopThree ? <p className={participant.win ? "text-cyan-200" : "text-rose-200"}>TOP {playerRank}</p> : <p className="text-slate-500">#{playerRank || "-"}</p>}
          <span className={participant.win ? "text-cyan-200" : "text-red-200"}>{participant.win ? "승리" : "패배"}</span>
          <p className={`mt-1 text-xs font-bold ${teamLuck.className}`}>{teamLuck.label}</p>
        </div>
      </div>
    </Link>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-2 py-2">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-100">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "slate" | "blue" | "red";
}) {
  const toneClass =
    tone === "blue"
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
      : tone === "red"
        ? "border-red-400/30 bg-red-500/10 text-red-100"
        : "border-white/10 bg-black/15 text-slate-100";

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-xs opacity-75">{sub}</p>
    </div>
  );
}

function championImageUrl(championName: string, version: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}

function getRecentMatchCardClass(win: boolean, isTopThree: boolean) {
  if (isTopThree && win) {
    return "border-cyan-300/50 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(15,23,42,0.72)_42%,rgba(59,130,246,0.18))] shadow-[0_0_34px_rgba(34,211,238,0.12)]";
  }
  if (isTopThree && !win) {
    return "border-rose-300/50 bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(15,23,42,0.74)_42%,rgba(251,113,133,0.14))] shadow-[0_0_34px_rgba(244,63,94,0.12)]";
  }
  return win ? "border-cyan-400/30 bg-cyan-400/10" : "border-red-400/30 bg-red-500/10";
}

function getTeamLuck(win: boolean, playerRank: number) {
  if (win && playerRank <= 3) return { label: "캐리 승", className: "text-cyan-200" };
  if (!win && playerRank <= 3) return { label: "팀운 아쉬움", className: "text-rose-200" };
  if (win && playerRank >= 7) return { label: "팀운 좋음", className: "text-amber-200" };
  if (!win && playerRank >= 7) return { label: "같이 흔들림", className: "text-slate-400" };
  return { label: "무난", className: "text-slate-400" };
}
