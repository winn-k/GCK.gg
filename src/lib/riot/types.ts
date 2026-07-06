export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export type RiotSummoner = {
  puuid: string;
  id?: string;
  accountId?: string;
  profileIconId: number;
  summonerLevel: number;
};

export type RiotLeagueEntry = {
  queueType: string;
  puuid?: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type RiotParticipant = {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName?: string;
  teamPosition?: string;
  individualPosition?: string;
  lane?: string;
  role?: string;
  championName: string;
  championId: number;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken?: number;
  damageDealtToObjectives?: number;
  damageDealtToTurrets?: number;
  totalTimeSpentDead?: number;
  largestKillingSpree?: number;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  visionWardsBoughtInGame?: number;
  detectorWardsPlaced?: number;
  summoner1Id: number;
  summoner2Id: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  goldEarned: number;
  champLevel: number;
  challenges?: Record<string, number | string | boolean | undefined>;
};

export type RiotMatch = {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    queueId: number;
    gameCreation: number;
    gameDuration: number;
    gameVersion: string;
    participants: RiotParticipant[];
    teams: Array<{
      teamId: number;
      win: boolean;
      objectives?: Record<string, { first: boolean; kills: number }>;
    }>;
  };
};

export type TournamentCallbackPayload = {
  startTime?: number;
  shortCode?: string;
  tournamentCode?: string;
  metaData?: string;
  gameId?: number;
  gameName?: string;
  gameType?: string;
  gameMap?: number;
  gameMode?: string;
  region?: string;
};
