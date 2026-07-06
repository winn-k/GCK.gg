import "server-only";
import { DEFAULT_PLATFORM, DEFAULT_REGION_GROUP, SEARCH_REFRESH_COOLDOWN_MS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  getAccountByRiotId,
  getLeagueEntriesByPuuid,
  getMatchById,
  getMatchIdsByPuuid,
  getSummonerByPuuid,
  parseRiotId,
} from "@/lib/riot/client";
import type { RiotMatch } from "@/lib/riot/types";

export async function upsertMatch(matchId: string, match: RiotMatch) {
  return prisma.match.upsert({
    where: { matchId },
    update: {
      regionGroup: DEFAULT_REGION_GROUP,
      queueId: match.info.queueId,
      gameCreation: new Date(match.info.gameCreation),
      gameDuration: match.info.gameDuration,
      gameVersion: match.info.gameVersion,
      rawJson: JSON.stringify(match),
      fetchedAt: new Date(),
    },
    create: {
      matchId,
      regionGroup: DEFAULT_REGION_GROUP,
      queueId: match.info.queueId,
      gameCreation: new Date(match.info.gameCreation),
      gameDuration: match.info.gameDuration,
      gameVersion: match.info.gameVersion,
      rawJson: JSON.stringify(match),
    },
  });
}

export async function searchSummoner(input: string, force = false) {
  const { gameName, tagLine } = parseRiotId(input);
  const account = await getAccountByRiotId(gameName, tagLine);
  const existing = await prisma.summoner.findUnique({
    where: { puuid: account.puuid },
    include: { ranks: true },
  });
  const freshEnough =
    existing && Date.now() - existing.updatedAt.getTime() < SEARCH_REFRESH_COOLDOWN_MS && !force;

  if (freshEnough) {
    const matchIds = await getMatchIdsByPuuid(account.puuid, 12);
    const matches = await getCachedMatchesByIds(matchIds);
    return {
      summoner: existing,
      matches,
      matchIds,
      missingMatchIds: matchIds.filter((matchId) => !matches.some((match) => match.matchId === matchId)),
      cooldownUntil: existing.updatedAt.getTime() + SEARCH_REFRESH_COOLDOWN_MS,
    };
  }

  const [summonerProfile, ranks, matchIds] = await Promise.all([
    getSummonerByPuuid(account.puuid),
    getLeagueEntriesByPuuid(account.puuid),
    getMatchIdsByPuuid(account.puuid, 12),
  ]);

  const savedSummoner = await prisma.summoner.upsert({
    where: { puuid: account.puuid },
    update: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId: summonerProfile.id,
      accountId: summonerProfile.accountId,
      profileIconId: summonerProfile.profileIconId,
      summonerLevel: summonerProfile.summonerLevel,
      region: DEFAULT_PLATFORM,
    },
    create: {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId: summonerProfile.id,
      accountId: summonerProfile.accountId,
      profileIconId: summonerProfile.profileIconId,
      summonerLevel: summonerProfile.summonerLevel,
      region: DEFAULT_PLATFORM,
    },
  });

  await Promise.all(
    ranks.map((rank) => {
      const rankData = {
        queueType: rank.queueType,
        tier: rank.tier,
        rank: rank.rank,
        leaguePoints: rank.leaguePoints,
        wins: rank.wins,
        losses: rank.losses,
      };

      return prisma.rankEntry.upsert({
        where: {
          summonerPuuid_queueType: {
            summonerPuuid: account.puuid,
            queueType: rank.queueType,
          },
        },
        update: rankData,
        create: {
          summonerPuuid: account.puuid,
          ...rankData,
        },
      });
    }),
  );

  const matches = force ? [] : await getCachedMatchesByIds(matchIds);

  return {
    summoner: await prisma.summoner.findUniqueOrThrow({
      where: { puuid: savedSummoner.puuid },
      include: { ranks: true },
    }),
    matches,
    matchIds,
    missingMatchIds: matchIds.filter((matchId) => !matches.some((match) => match.matchId === matchId)),
    cooldownUntil: savedSummoner.updatedAt.getTime() + SEARCH_REFRESH_COOLDOWN_MS,
  };
}

export async function getSummonerPageData(gameName: string, tagLine: string) {
  return searchSummoner(`${decodeURIComponent(gameName)}#${decodeURIComponent(tagLine)}`, false);
}

export async function syncSummonerMatches(puuid: string, count = 12) {
  const matchIds = await getMatchIdsByPuuid(puuid, count);
  const cached = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true },
  });
  const cachedIds = new Set(cached.map((match) => match.matchId));
  const missingIds = matchIds.filter((matchId) => !cachedIds.has(matchId));
  const synced = [];

  for (const matchId of missingIds) {
    const match = await getMatchById(matchId);
    synced.push(await upsertMatch(matchId, match));
  }

  return {
    requested: matchIds.length,
    alreadyCached: cachedIds.size,
    synced: synced.length,
    missingBeforeSync: missingIds.length,
  };
}

async function getCachedMatchesByIds(matchIds: string[]) {
  if (!matchIds.length) return [];
  const matches = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
  });
  const order = new Map(matchIds.map((matchId, index) => [matchId, index]));
  return matches
    .filter((match) => {
      try {
        const parsed = JSON.parse(match.rawJson) as RiotMatch;
        return parsed.metadata.matchId === match.matchId;
      } catch {
        return false;
      }
    })
    .sort((a, b) => (order.get(a.matchId) ?? 999) - (order.get(b.matchId) ?? 999));
}
