import "server-only";
import { prisma } from "@/lib/prisma";
import { getMatchById } from "@/lib/riot/client";
import { upsertMatch } from "./summoners";

export async function getStoredOrFetchedMatch(matchId: string, force = false) {
  const cached = await prisma.match.findUnique({ where: { matchId } });
  if (cached && !force) return cached;
  const match = await getMatchById(matchId);
  return upsertMatch(matchId, match);
}
