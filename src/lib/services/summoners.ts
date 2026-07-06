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
    const recentMatches = await prisma.match.findMany({
      orderBy: { gameCreation: "desc" },
      take: 60,
    });
    const matches = recentMatches
      .filter((match) => {
        try {
          const parsed = JSON.parse(match.rawJson) as RiotMatch;
          return parsed.metadata.participants.includes(account.puuid);
        } catch {
          return false;
        }
      })
      .slice(0, 12);
    return { summoner: existing, matches, cooldownUntil: existing.updatedAt.getTime() + SEARCH_REFRESH_COOLDOWN_MS };
  }

  const summonerProfile = await getSummonerByPuuid(account.puuid);
  const ranks = await getLeagueEntriesByPuuid(account.puuid);
  const matchIds = await getMatchIdsByPuuid(account.puuid, 12);

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

  const matches = await Promise.all(
    matchIds.map(async (matchId) => {
      const cached = await prisma.match.findUnique({ where: { matchId } });
      if (cached && !force) return cached;
      const match = await getMatchById(matchId);
      return upsertMatch(matchId, match);
    }),
  );

  return {
    summoner: await prisma.summoner.findUniqueOrThrow({
      where: { puuid: savedSummoner.puuid },
      include: { ranks: true },
    }),
    matches,
    cooldownUntil: savedSummoner.updatedAt.getTime() + SEARCH_REFRESH_COOLDOWN_MS,
  };
}

export async function getSummonerPageData(gameName: string, tagLine: string) {
  return searchSummoner(`${decodeURIComponent(gameName)}#${decodeURIComponent(tagLine)}`, false);
}
