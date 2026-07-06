import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { makeMockMatch } from "../src/lib/riot/mock";

const prisma = new PrismaClient();

async function main() {
  const match = makeMockMatch("KR_9876543210");
  await prisma.match.upsert({
    where: { matchId: match.metadata.matchId },
    update: {
      rawJson: JSON.stringify(match),
      gameCreation: new Date(match.info.gameCreation),
      gameDuration: match.info.gameDuration,
      gameVersion: match.info.gameVersion,
      queueId: match.info.queueId,
      regionGroup: "asia",
    },
    create: {
      matchId: match.metadata.matchId,
      rawJson: JSON.stringify(match),
      gameCreation: new Date(match.info.gameCreation),
      gameDuration: match.info.gameDuration,
      gameVersion: match.info.gameVersion,
      queueId: match.info.queueId,
      regionGroup: "asia",
    },
  });

  await prisma.summoner.upsert({
    where: { puuid: "mock-puuid-hide-on-bush-kr1" },
    update: {
      gameName: "Hide on bush",
      tagLine: "KR1",
      summonerId: "mock-summoner-id",
      accountId: "mock-account-id",
      profileIconId: 588,
      summonerLevel: 721,
      region: "kr",
    },
    create: {
      puuid: "mock-puuid-hide-on-bush-kr1",
      gameName: "Hide on bush",
      tagLine: "KR1",
      summonerId: "mock-summoner-id",
      accountId: "mock-account-id",
      profileIconId: 588,
      summonerLevel: 721,
      region: "kr",
    },
  });

  await prisma.scrim.upsert({
    where: { tournamentCode: "MOCK-DEMO-CODE" },
    update: {},
    create: {
      title: "점심시간 5대5 내전",
      description: "seed로 들어간 mock 내전입니다.",
      status: "COMPLETED",
      tournamentCode: "MOCK-DEMO-CODE",
      providerId: "mock-provider",
      tournamentId: "mock-tournament",
      matchId: match.metadata.matchId,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      callbackPayload: JSON.stringify({
        shortCode: "MOCK-DEMO-CODE",
        gameId: 9876543210,
        region: "KR",
      }),
      participants: {
        create: [
          { gameName: "Hide on bush", tagLine: "KR1", teamName: "블루팀" },
          { gameName: "GCK Friend 1", tagLine: "KR1", teamName: "블루팀" },
          { gameName: "GCK Friend 5", tagLine: "KR1", teamName: "레드팀" },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
