import type { RiotLeagueEntry, RiotMatch } from "./types";

export const mockAccount = {
  puuid: "mock-puuid-hide-on-bush-kr1",
  gameName: "Hide on bush",
  tagLine: "KR1",
};

export const mockSummoner = {
  id: "mock-summoner-id",
  accountId: "mock-account-id",
  puuid: mockAccount.puuid,
  profileIconId: 588,
  summonerLevel: 721,
};

export const mockRanks: RiotLeagueEntry[] = [
  {
    queueType: "RANKED_SOLO_5x5",
    tier: "CHALLENGER",
    rank: "I",
    leaguePoints: 1024,
    wins: 121,
    losses: 82,
  },
  {
    queueType: "RANKED_FLEX_SR",
    tier: "DIAMOND",
    rank: "II",
    leaguePoints: 44,
    wins: 33,
    losses: 22,
  },
];

const champions = ["Ahri", "LeeSin", "Jinx", "Graves", "Thresh", "Orianna", "Ezreal", "Rell", "Gnar", "Viego"];

export function makeMockMatch(matchId = "KR_9876543210", targetPuuid = mockAccount.puuid): RiotMatch {
  const participants = champions.map((championName, index) => {
    const teamId = index < 5 ? 100 : 200;
    const win = teamId === 100;
    const deaths = index % 4;
    return {
      puuid: index === 0 ? targetPuuid : `mock-puuid-${index}`,
      riotIdGameName: index === 0 ? "Hide on bush" : `GCK Friend ${index}`,
      riotIdTagline: "KR1",
      summonerName: `GCK Friend ${index}`,
      championName,
      championId: 1 + index,
      teamId,
      win,
      kills: 3 + index,
      deaths,
      assists: 8 - Math.min(index % 5, 4),
      totalMinionsKilled: 120 + index * 13,
      neutralMinionsKilled: index % 3 === 0 ? 22 : 4,
      totalDamageDealtToChampions: 11000 + index * 1850,
      visionScore: 12 + index * 3,
      wardsPlaced: 5 + index,
      wardsKilled: index % 4,
      summoner1Id: index % 2 === 0 ? 4 : 14,
      summoner2Id: index % 2 === 0 ? 12 : 4,
      item0: 1055,
      item1: 3047,
      item2: 3031,
      item3: index % 2 === 0 ? 6672 : 3157,
      item4: 3072,
      item5: 3363,
      item6: 0,
      goldEarned: 9500 + index * 450,
      champLevel: 12 + (index % 5),
    };
  });

  return {
    metadata: {
      matchId,
      participants: participants.map((participant) => participant.puuid),
    },
    info: {
      queueId: 420,
      gameCreation: Date.now() - 1000 * 60 * 60 * 6,
      gameDuration: 1834,
      gameVersion: "16.13.1",
      participants,
      teams: [
        { teamId: 100, win: true },
        { teamId: 200, win: false },
      ],
    },
  };
}

export function makeMockMatchIds() {
  return ["KR_9876543210", "KR_9876543209", "KR_9876543208"];
}
