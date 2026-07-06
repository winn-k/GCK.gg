import type { RiotMatch, RiotParticipant } from "@/lib/riot/types";
import { percent } from "@/lib/utils";

export type PlayerAnalysis = {
  participant: RiotParticipant;
  kda: number;
  killParticipation: number;
  cs: number;
  csPerMinute: number;
  damageShare: number;
  goldShare: number;
  visionPerMinute: number;
  objectiveDamage: number;
  score: number;
};

export type TeamAnalysis = {
  teamId: number;
  label: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  vision: number;
  objectives: Array<{ key: string; label: string; kills: number; first: boolean }>;
};

type PickStat = {
  name: string;
  games: number;
  wins: number;
  winRate: number;
};

const objectiveLabels: Record<string, string> = {
  baron: "바론",
  dragon: "드래곤",
  horde: "유충",
  riftHerald: "전령",
  tower: "타워",
  inhibitor: "억제기",
  champion: "킬",
};

export function normalizePosition(participant: RiotParticipant) {
  const raw = participant.teamPosition || participant.individualPosition || participant.lane || participant.role || "UNKNOWN";
  if (raw === "UTILITY") return "SUPPORT";
  if (raw === "MIDDLE") return "MID";
  if (raw === "BOTTOM") return "ADC";
  if (raw === "JUNGLE") return "JUNGLE";
  if (raw === "TOP") return "TOP";
  return "UNKNOWN";
}

export function positionLabel(position: string) {
  const labels: Record<string, string> = {
    TOP: "탑",
    JUNGLE: "정글",
    MID: "미드",
    ADC: "원딜",
    SUPPORT: "서폿",
    UNKNOWN: "포지션",
  };
  return labels[position] ?? position;
}

export function analyzeMatch(match: RiotMatch) {
  const minutes = Math.max(match.info.gameDuration / 60, 1);
  const teams = [100, 200].map((teamId) => analyzeTeam(match, teamId));
  const players = match.info.participants
    .map((participant) => analyzePlayer(match, participant, minutes))
    .sort((a, b) => b.score - a.score);
  const highlights = buildHighlights(teams, players);

  return {
    minutes,
    teams,
    players,
    highlights,
    mvp: players[0],
  };
}

export function analyzePlayer(match: RiotMatch, participant: RiotParticipant, minutes?: number): PlayerAnalysis {
  const gameMinutes = minutes ?? Math.max(match.info.gameDuration / 60, 1);
  const team = match.info.participants.filter((item) => item.teamId === participant.teamId);
  const teamKills = team.reduce((sum, item) => sum + item.kills, 0);
  const teamDamage = team.reduce((sum, item) => sum + item.totalDamageDealtToChampions, 0);
  const teamGold = team.reduce((sum, item) => sum + item.goldEarned, 0);
  const cs = participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const kda = (participant.kills + participant.assists) / Math.max(participant.deaths, 1);
  const apiKillParticipation = numberChallenge(participant, "killParticipation");
  const killParticipation = apiKillParticipation ? Math.round(apiKillParticipation * 100) : percent(participant.kills + participant.assists, teamKills);
  const damageShare = percent(participant.totalDamageDealtToChampions, teamDamage);
  const goldShare = percent(participant.goldEarned, teamGold);
  const csPerMinute = round1(cs / gameMinutes);
  const visionPerMinute = round1(participant.visionScore / gameMinutes);
  const objectiveDamage = participant.damageDealtToObjectives ?? 0;

  return {
    participant,
    kda: round1(kda),
    killParticipation,
    cs,
    csPerMinute,
    damageShare,
    goldShare,
    visionPerMinute,
    objectiveDamage,
    score: performanceScore({
      win: participant.win,
      kda,
      killParticipation,
      damageShare,
      goldShare,
      csPerMinute,
      visionPerMinute,
      deaths: participant.deaths,
      objectiveDamage,
      minutes: gameMinutes,
    }),
  };
}

export function summarizeRecentMatches(matches: RiotMatch[], puuid: string) {
  const rows = matches
    .map((match) => {
      const participant = match.info.participants.find((item) => item.puuid === puuid);
      return participant ? analyzePlayer(match, participant) : null;
    })
    .filter((row): row is PlayerAnalysis => Boolean(row));

  if (!rows.length) {
    return {
      games: 0,
      wins: 0,
      winRate: 0,
      avgKda: 0,
      avgCsPerMinute: 0,
      avgDamageShare: 0,
      avgVisionPerMinute: 0,
      avgKillParticipation: 0,
      bestChampion: null as string | null,
      mostPlayedChampion: null as PickStat | null,
      bestPosition: null as PickStat | null,
      championStats: [] as PickStat[],
      positionStats: [] as PickStat[],
    };
  }

  const championStats = buildPickStats(rows.map((row) => ({ name: row.participant.championName, win: row.participant.win })));
  const positionStats = buildPickStats(rows.map((row) => ({ name: normalizePosition(row.participant), win: row.participant.win })));
  const wins = rows.filter((row) => row.participant.win).length;

  return {
    games: rows.length,
    wins,
    winRate: percent(wins, rows.length),
    avgKda: round1(avg(rows.map((row) => row.kda))),
    avgCsPerMinute: round1(avg(rows.map((row) => row.csPerMinute))),
    avgDamageShare: Math.round(avg(rows.map((row) => row.damageShare))),
    avgVisionPerMinute: round1(avg(rows.map((row) => row.visionPerMinute))),
    avgKillParticipation: Math.round(avg(rows.map((row) => row.killParticipation))),
    bestChampion: championStats[0]?.name ?? null,
    mostPlayedChampion: championStats[0] ?? null,
    bestPosition: [...positionStats].sort((a, b) => b.winRate - a.winRate || b.games - a.games)[0] ?? null,
    championStats,
    positionStats,
  };
}

function analyzeTeam(match: RiotMatch, teamId: number): TeamAnalysis {
  const participants = match.info.participants.filter((item) => item.teamId === teamId);
  const team = match.info.teams.find((item) => item.teamId === teamId);
  return {
    teamId,
    label: teamId === 100 ? "블루팀" : "레드팀",
    win: Boolean(team?.win ?? participants[0]?.win),
    kills: participants.reduce((sum, item) => sum + item.kills, 0),
    deaths: participants.reduce((sum, item) => sum + item.deaths, 0),
    assists: participants.reduce((sum, item) => sum + item.assists, 0),
    gold: participants.reduce((sum, item) => sum + item.goldEarned, 0),
    damage: participants.reduce((sum, item) => sum + item.totalDamageDealtToChampions, 0),
    vision: participants.reduce((sum, item) => sum + item.visionScore, 0),
    objectives: Object.entries(team?.objectives ?? {})
      .filter(([key]) => key !== "champion")
      .map(([key, value]) => ({
        key,
        label: objectiveLabels[key] ?? key,
        kills: value.kills,
        first: value.first,
      })),
  };
}

function buildHighlights(teams: TeamAnalysis[], players: PlayerAnalysis[]) {
  const damageLeader = [...players].sort((a, b) => b.participant.totalDamageDealtToChampions - a.participant.totalDamageDealtToChampions)[0];
  const visionLeader = [...players].sort((a, b) => b.participant.visionScore - a.participant.visionScore)[0];
  const objectiveLeader = [...players].sort((a, b) => b.objectiveDamage - a.objectiveDamage)[0];
  const winningTeam = teams.find((team) => team.win);
  const losingTeam = teams.find((team) => !team.win);
  const goldDiff = winningTeam && losingTeam ? winningTeam.gold - losingTeam.gold : 0;
  const damageDiff = winningTeam && losingTeam ? winningTeam.damage - losingTeam.damage : 0;

  return [
    `${winningTeam?.label ?? "승리팀"}이 골드 ${signed(goldDiff)} 차이로 게임을 끝냈습니다.`,
    `${playerName(damageLeader)}가 챔피언 피해량 ${damageLeader.participant.totalDamageDealtToChampions.toLocaleString()}으로 최다 딜을 기록했습니다.`,
    `${playerName(visionLeader)}가 시야 점수 ${visionLeader.participant.visionScore}로 맵 장악에 가장 많이 기여했습니다.`,
    objectiveLeader.objectiveDamage > 0
      ? `${playerName(objectiveLeader)}가 오브젝트 피해량 ${objectiveLeader.objectiveDamage.toLocaleString()}으로 운영 기여도가 높았습니다.`
      : `팀 전체 딜 차이는 ${signed(damageDiff)}입니다.`,
  ];
}

function buildPickStats(rows: Array<{ name: string; win: boolean }>) {
  const map = new Map<string, { games: number; wins: number }>();
  rows.forEach((row) => {
    const current = map.get(row.name) ?? { games: 0, wins: 0 };
    current.games += 1;
    current.wins += row.win ? 1 : 0;
    map.set(row.name, current);
  });
  return [...map.entries()]
    .map(([name, stat]) => ({
      name,
      games: stat.games,
      wins: stat.wins,
      winRate: percent(stat.wins, stat.games),
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate || a.name.localeCompare(b.name));
}

function performanceScore(input: {
  win: boolean;
  kda: number;
  killParticipation: number;
  damageShare: number;
  goldShare: number;
  csPerMinute: number;
  visionPerMinute: number;
  deaths: number;
  objectiveDamage: number;
  minutes: number;
}) {
  const raw =
    3.8 +
    Math.min(input.kda, 8) * 0.42 +
    input.killParticipation * 0.025 +
    input.damageShare * 0.035 +
    input.goldShare * 0.02 +
    input.csPerMinute * 0.16 +
    input.visionPerMinute * 0.22 +
    Math.min(input.objectiveDamage / Math.max(input.minutes, 1), 300) * 0.002 +
    (input.win ? 0.6 : 0) -
    Math.max(input.deaths - 5, 0) * 0.18;

  return Math.max(0, Math.min(10, round1(raw)));
}

function numberChallenge(participant: RiotParticipant, key: string) {
  const value = participant.challenges?.[key];
  return typeof value === "number" ? value : null;
}

function avg(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function signed(value: number) {
  return value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
}

function playerName(row: PlayerAnalysis) {
  return row.participant.riotIdGameName ?? row.participant.summonerName ?? row.participant.championName;
}
