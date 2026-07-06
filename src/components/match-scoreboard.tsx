import Link from "next/link";
import { queueNames } from "@/lib/constants";
import { analyzeMatch, analyzePlayer } from "@/lib/analytics/match";
import { getChampionImageByKey, getDDragonVersion, getSpellIdMap, itemUrl, spellUrl } from "@/lib/riot/ddragon";
import type { RiotMatch, RiotParticipant } from "@/lib/riot/types";
import { cn, formatDuration } from "@/lib/utils";

export async function MatchScoreboard({ match, focusPuuid }: { match: RiotMatch; focusPuuid?: string }) {
  const version = await getDDragonVersion();
  const spellMap = await getSpellIdMap(version);
  const analysis = analyzeMatch(match);
  const blue = match.info.participants.filter((participant) => participant.teamId === 100);
  const red = match.info.participants.filter((participant) => participant.teamId === 200);
  const blueWin = blue[0]?.win;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0d1320] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{queueNames[match.info.queueId] ?? `Queue ${match.info.queueId}`}</p>
          <h2 className="mt-1 text-xl font-black text-white">{match.metadata.matchId}</h2>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>{formatDuration(match.info.gameDuration)}</p>
          <p>{new Date(match.info.gameCreation).toLocaleString("ko-KR")}</p>
        </div>
      </div>
      <section className="rounded-lg border border-white/10 bg-[#0d1320] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {analysis.teams.map((team) => (
            <div key={team.teamId} className={cn("rounded-lg border p-3", team.win ? "border-cyan-400/40 bg-cyan-400/10" : "border-red-400/30 bg-red-500/10")}>
              <p className={cn("text-sm font-semibold", team.win ? "text-cyan-200" : "text-red-200")}>
                {team.label} {team.win ? "승리" : "패배"}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{team.kills}킬</p>
              <p className="text-xs text-slate-400">
                골드 {team.gold.toLocaleString()} · 딜 {team.damage.toLocaleString()} · 시야 {team.vision}
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 md:col-span-2">
            <p className="text-sm font-semibold text-amber-200">GCK 평점 MVP</p>
            <p className="mt-1 text-2xl font-black text-white">
              {analysis.mvp.participant.riotIdGameName ?? analysis.mvp.participant.summonerName ?? analysis.mvp.participant.championName}
            </p>
            <p className="text-xs text-slate-300">
              {analysis.mvp.participant.championName} · {analysis.mvp.score.toFixed(1)}점 · KP {analysis.mvp.killParticipation}%
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg border border-white/10 bg-black/15 p-3">
            <p className="text-sm font-bold text-white">오브젝트</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {analysis.teams.map((team) => (
                <div key={team.teamId}>
                  <p className="mb-2 text-xs font-semibold text-slate-400">{team.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {team.objectives.length ? (
                      team.objectives.map((objective) => (
                        <span key={`${team.teamId}-${objective.key}`} className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-slate-200">
                          {objective.label} {objective.kills}
                          {objective.first ? " · 선취" : ""}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">기록 없음</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/15 p-3">
            <p className="text-sm font-bold text-white">경기 읽기</p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-300">
              {analysis.highlights.map((highlight) => (
                <li key={highlight} className="rounded-md border border-white/5 bg-white/[0.04] px-3 py-2">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <TeamTable
        title="블루팀"
        win={blueWin}
        participants={blue}
        match={match}
        version={version}
        spellMap={spellMap}
        focusPuuid={focusPuuid}
      />
      <TeamTable
        title="레드팀"
        win={!blueWin}
        participants={red}
        match={match}
        version={version}
        spellMap={spellMap}
        focusPuuid={focusPuuid}
      />
    </div>
  );
}

async function TeamTable({
  title,
  win,
  participants,
  match,
  version,
  spellMap,
  focusPuuid,
}: {
  title: string;
  win?: boolean;
  participants: RiotParticipant[];
  match: RiotMatch;
  version: string;
  spellMap: Map<number, string>;
  focusPuuid?: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0d1320]">
      <div className={cn("flex items-center justify-between border-b border-white/10 px-4 py-3", win ? "bg-cyan-400/10" : "bg-red-500/10")}>
        <h3 className={cn("font-bold", win ? "text-cyan-200" : "text-red-200")}>{title}</h3>
        <span className={cn("text-sm font-semibold", win ? "text-cyan-200" : "text-red-200")}>{win ? "승리" : "패배"}</span>
      </div>
      <div className="hidden grid-cols-[minmax(220px,1.2fr)_96px_1fr_92px_92px_92px_92px] gap-3 border-b border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-slate-400 lg:grid">
        <span>소환사</span>
        <span>스펠</span>
        <span>아이템</span>
        <span>KDA</span>
        <span>KP/CSM</span>
        <span>딜비중</span>
        <span>시야분</span>
      </div>
      <div className="divide-y divide-white/10">
        {await Promise.all(
          participants.map(async (participant) => {
            const row = analyzePlayer(match, participant);
            const championUrl = await getChampionImageByKey(participant.championName, version);
            const items = [
              participant.item0,
              participant.item1,
              participant.item2,
              participant.item3,
              participant.item4,
              participant.item5,
              participant.item6,
            ];
            return (
              <div
                key={participant.puuid}
                className={cn(
                  "grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(220px,1.2fr)_96px_1fr_92px_92px_92px_92px]",
                  participant.puuid === focusPuuid && "bg-cyan-400/10",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img src={championUrl} alt={participant.championName} className="h-11 w-11 rounded-md" />
                  <div className="min-w-0">
                    <Link
                      href={`/summoners/kr/${encodeURIComponent(participant.riotIdGameName ?? participant.summonerName ?? "Unknown")}/${encodeURIComponent(participant.riotIdTagline ?? "KR1")}`}
                      className="block truncate font-semibold text-white hover:text-cyan-200"
                    >
                      {participant.riotIdGameName ?? participant.summonerName ?? "Unknown"}#
                      {participant.riotIdTagline ?? "KR1"}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {participant.championName} · {participant.teamPosition || participant.individualPosition || "POSITION"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[participant.summoner1Id, participant.summoner2Id].map((spellId) => {
                    const url = spellUrl(spellMap.get(spellId), version);
                    return url ? <img key={spellId} src={url} alt={`spell-${spellId}`} className="h-6 w-6 rounded" /> : null;
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {items.map((item, index) => {
                    const url = itemUrl(item, version);
                    return url ? (
                      <img key={`${item}-${index}`} src={url} alt={`item-${item}`} className="h-7 w-7 rounded bg-slate-100" />
                    ) : (
                      <span key={`${item}-${index}`} className="h-7 w-7 rounded bg-white/10" />
                    );
                  })}
                </div>
                <Metric label="KDA" value={`${participant.kills}/${participant.deaths}/${participant.assists}`} sub={`${row.kda.toFixed(1)} 평점`} />
                <Metric label="KP/CSM" value={`${row.killParticipation}%`} sub={`${row.csPerMinute.toFixed(1)} CS/min`} />
                <Metric label="딜비중" value={`${row.damageShare}%`} sub={`${participant.totalDamageDealtToChampions.toLocaleString()} dmg`} />
                <Metric label="시야분" value={row.visionPerMinute.toFixed(1)} sub={`시야 ${participant.visionScore}`} />
              </div>
            );
          }),
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-slate-300">
      <p className="text-xs font-semibold text-slate-500 lg:hidden">{label}</p>
      <p className="font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
