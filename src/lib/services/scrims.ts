import "server-only";
import { DEFAULT_PLATFORM } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  createTournament,
  createTournamentCode,
  createTournamentProvider,
  getLobbyEvents,
  getMatchById,
  getTournamentCode,
  matchIdFromTournamentCallback,
} from "@/lib/riot/client";
import type { TournamentCallbackPayload } from "@/lib/riot/types";
import { upsertMatch } from "./summoners";

export async function createScrim(data: {
  title: string;
  description?: string;
  scheduledAt?: string;
  teams?: Array<{ teamName: string; players: string }>;
}) {
  return prisma.scrim.create({
    data: {
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      participants: {
        create:
          data.teams?.flatMap((team) =>
            team.players
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((riotId) => {
                const [gameName, tagLine = "KR1"] = riotId.split("#");
                return {
                  gameName: gameName.trim(),
                  tagLine: tagLine.trim(),
                  teamName: team.teamName,
                };
              }),
          ) ?? [],
      },
    },
    include: { participants: true },
  });
}

export async function issueTournamentCode(scrimId: number) {
  const scrim = await prisma.scrim.findUniqueOrThrow({
    where: { id: scrimId },
    include: { participants: true },
  });

  const providerId = process.env.RIOT_TOURNAMENT_PROVIDER_ID || String(await createTournamentProvider());
  const tournamentId =
    process.env.RIOT_TOURNAMENT_ID || String(await createTournament(providerId, `GCK.gg ${scrim.title}`));
  const tournamentCode = await createTournamentCode(tournamentId, {
    scrimId,
    title: scrim.title,
    scheduledAt: scrim.scheduledAt?.toISOString(),
  });

  return prisma.scrim.update({
    where: { id: scrimId },
    data: {
      providerId,
      tournamentId,
      tournamentCode,
      status: "CODE_CREATED",
    },
    include: { participants: true },
  });
}

export async function recordTournamentCallback(payload: TournamentCallbackPayload) {
  const tournamentCode = payload.shortCode ?? payload.tournamentCode;
  const matchId = matchIdFromTournamentCallback(payload);

  const scrim = tournamentCode
    ? await prisma.scrim.findFirst({ where: { tournamentCode } })
    : null;

  if (!scrim) {
    await prisma.riotApiLog.create({
      data: {
        endpoint: "/api/riot/tournament-callback",
        cacheKey: `unmatched:${tournamentCode ?? payload.gameId ?? Date.now()}`,
        status: 202,
        responseJson: JSON.stringify(payload),
      },
    });
    return null;
  }

  const updated = await prisma.scrim.update({
    where: { id: scrim.id },
    data: {
      callbackPayload: JSON.stringify(payload),
      matchId,
      status: matchId ? "IN_PROGRESS" : "SYNC_FAILED",
    },
  });

  if (matchId) {
    await syncScrimMatch(updated.id, matchId);
  }

  return updated;
}

export async function syncScrimMatch(scrimId: number, explicitMatchId?: string) {
  const scrim = await prisma.scrim.findUniqueOrThrow({ where: { id: scrimId } });
  const matchId = explicitMatchId ?? scrim.matchId;

  if (!matchId) {
    if (scrim.tournamentCode) {
      await getTournamentCode(scrim.tournamentCode);
      await getLobbyEvents(scrim.tournamentCode);
    }
    return prisma.scrim.update({
      where: { id: scrimId },
      data: { status: "SYNC_FAILED" },
    });
  }

  try {
    const match = await getMatchById(matchId);
    await upsertMatch(matchId, match);
    return prisma.scrim.update({
      where: { id: scrimId },
      data: {
        matchId,
        status: "COMPLETED",
      },
      include: { participants: true },
    });
  } catch (error) {
    await prisma.scrim.update({
      where: { id: scrimId },
      data: { status: "SYNC_FAILED" },
    });
    throw error;
  }
}

export async function seedDemoScrimIfEmpty() {
  const count = await prisma.scrim.count();
  if (count > 0) return;
  const match = await getMatchById(`${DEFAULT_PLATFORM.toUpperCase()}_9876543210`);
  const stored = await upsertMatch(match.metadata.matchId, match);
  await prisma.scrim.create({
    data: {
      title: "점심시간 5대5 내전",
      description: "mock 데이터로 들어간 샘플 경기입니다.",
      status: "COMPLETED",
      tournamentCode: "MOCK-DEMO-CODE",
      providerId: "mock-provider",
      tournamentId: "mock-tournament",
      matchId: stored.matchId,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      callbackPayload: JSON.stringify({
        shortCode: "MOCK-DEMO-CODE",
        gameId: 9876543210,
        region: DEFAULT_PLATFORM.toUpperCase(),
      }),
      participants: {
        create: [
          { gameName: "Hide on bush", tagLine: "KR1", teamName: "3반" },
          { gameName: "GCK Friend 1", tagLine: "KR1", teamName: "3반" },
          { gameName: "GCK Friend 5", tagLine: "KR1", teamName: "4반" },
        ],
      },
    },
  });
}
