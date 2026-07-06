import "server-only";
import { DEFAULT_PLATFORM, DEFAULT_REGION_GROUP } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { RiotApiError } from "./errors";
import { makeMockMatch, makeMockMatchIds, mockAccount, mockRanks, mockSummoner } from "./mock";
import type { RiotAccount, RiotLeagueEntry, RiotMatch, RiotSummoner, TournamentCallbackPayload } from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  cacheSeconds?: number;
  useRegionalHost?: boolean;
};

const RIOT_KEY = process.env.RIOT_API_KEY;

function platformHost(platform = DEFAULT_PLATFORM) {
  return `https://${platform.toLowerCase()}.api.riotgames.com`;
}

function regionalHost(regionGroup = DEFAULT_REGION_GROUP) {
  return `https://${regionGroup.toLowerCase()}.api.riotgames.com`;
}

function isMockMode() {
  return !RIOT_KEY || RIOT_KEY.trim().length === 0;
}

function cacheKey(method: string, url: string, body?: unknown) {
  return `${method}:${url}:${body ? JSON.stringify(body) : ""}`;
}

async function riotRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (isMockMode()) {
    throw new RiotApiError("RIOT_API_KEY가 없어 mock 데이터를 사용합니다.", 503);
  }

  const method = options.method ?? "GET";
  const host = options.useRegionalHost === false ? platformHost() : regionalHost();
  const url = `${host}${path}`;
  const key = cacheKey(method, url, options.body);

  if (method === "GET" && options.cacheSeconds) {
    const cached = await prisma.riotApiLog.findFirst({
      where: {
        cacheKey: key,
        status: 200,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (cached) return JSON.parse(cached.responseJson) as T;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Riot-Token": RIOT_KEY ?? "",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const responseJson = text || "null";
  const retryAfter = response.headers.get("Retry-After");

  await prisma.riotApiLog.create({
    data: {
      endpoint: path,
      cacheKey: key,
      status: response.status,
      responseJson,
      expiresAt: options.cacheSeconds ? new Date(Date.now() + options.cacheSeconds * 1000) : null,
    },
  });

  if (!response.ok) {
    let details: unknown = text;
    try {
      details = JSON.parse(text);
    } catch {
      details = text;
    }
    throw new RiotApiError(
      `Riot API 요청 실패: ${response.status} ${response.statusText}`,
      response.status,
      retryAfter ? Number(retryAfter) : undefined,
      details,
    );
  }

  return JSON.parse(responseJson) as T;
}

async function riotPlatformRequest<T>(path: string, options: RequestOptions = {}) {
  return riotRequest<T>(path, { ...options, useRegionalHost: false });
}

export function parseRiotId(input: string) {
  const [gameName, tagLine] = input.split("#").map((part) => part.trim());
  if (!gameName || !tagLine) {
    throw new Error("Riot ID는 gameName#tagLine 형식으로 입력하세요. 예: Hide on bush#KR1");
  }
  return { gameName, tagLine };
}

export async function getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
  if (isMockMode()) return { ...mockAccount, gameName, tagLine };
  return riotRequest<RiotAccount>(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { cacheSeconds: 60 * 60 },
  );
}

export async function getAccountByPuuid(puuid: string): Promise<RiotAccount> {
  if (isMockMode()) return { ...mockAccount, puuid };
  return riotRequest<RiotAccount>(`/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`, {
    cacheSeconds: 60 * 60,
  });
}

export async function getSummonerByPuuid(puuid: string): Promise<RiotSummoner> {
  if (isMockMode()) return { ...mockSummoner, puuid };
  return riotPlatformRequest<RiotSummoner>(`/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`, {
    cacheSeconds: 60 * 15,
  });
}

export async function getLeagueEntriesByPuuid(puuid: string): Promise<RiotLeagueEntry[]> {
  if (isMockMode()) return mockRanks;
  return riotPlatformRequest<RiotLeagueEntry[]>(
    `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    { cacheSeconds: 60 * 5 },
  );
}

export async function getMatchIdsByPuuid(puuid: string, count = 10) {
  if (isMockMode()) return makeMockMatchIds();
  return riotRequest<string[]>(
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`,
    { cacheSeconds: 60 * 3 },
  );
}

export async function getMatchById(matchId: string): Promise<RiotMatch> {
  if (isMockMode()) return makeMockMatch(matchId);
  return riotRequest<RiotMatch>(`/lol/match/v5/matches/${encodeURIComponent(matchId)}`, {
    cacheSeconds: 60 * 60 * 24,
  });
}

export async function createTournamentProvider() {
  const callbackUrl = process.env.RIOT_TOURNAMENT_CALLBACK_URL;
  if (!callbackUrl) {
    throw new RiotApiError("RIOT_TOURNAMENT_CALLBACK_URL이 필요합니다.", 400);
  }
  if (isMockMode()) return `mock-provider-${Date.now()}`;

  return riotPlatformRequest<number>("/lol/tournament/v5/providers", {
    method: "POST",
    body: {
      region: DEFAULT_PLATFORM.toUpperCase(),
      url: callbackUrl,
    },
  });
}

export async function createTournament(providerId: string, name: string) {
  if (isMockMode()) return `mock-tournament-${Date.now()}`;
  return riotPlatformRequest<number>("/lol/tournament/v5/tournaments", {
    method: "POST",
    body: {
      name,
      providerId: Number(providerId),
    },
  });
}

export async function createTournamentCode(tournamentId: string, metadata: Record<string, unknown>) {
  if (isMockMode()) return `MOCK-${Date.now().toString(36).toUpperCase()}`;
  return riotPlatformRequest<string>("/lol/tournament/v5/codes", {
    method: "POST",
    body: {
      allowedSummonerIds: [],
      enoughPlayers: false,
      mapType: "SUMMONERS_RIFT",
      metadata: JSON.stringify(metadata),
      pickType: "TOURNAMENT_DRAFT",
      spectatorType: "ALL",
      teamSize: 5,
      tournamentId: Number(tournamentId),
    },
  });
}

export async function getTournamentCode(tournamentCode: string) {
  if (isMockMode()) {
    return {
      code: tournamentCode,
      map: "SUMMONERS_RIFT",
      pickType: "TOURNAMENT_DRAFT",
      teamSize: 5,
      spectatorType: "ALL",
    };
  }
  return riotPlatformRequest<unknown>(`/lol/tournament/v5/codes/${encodeURIComponent(tournamentCode)}`, {
    cacheSeconds: 60,
  });
}

export async function getLobbyEvents(tournamentCode: string) {
  if (isMockMode()) {
    return {
      eventList: [
        { timestamp: `${Date.now() - 60000}`, eventType: "PracticeGameCreatedEvent" },
        { timestamp: `${Date.now() - 30000}`, eventType: "ChampSelectStartedEvent" },
      ],
    };
  }
  return riotPlatformRequest<unknown>(
    `/lol/tournament/v5/lobby-events/by-code/${encodeURIComponent(tournamentCode)}`,
    { cacheSeconds: 60 },
  );
}

export function matchIdFromTournamentCallback(payload: TournamentCallbackPayload) {
  if (!payload.gameId) return null;
  const region = (payload.region ?? DEFAULT_PLATFORM).toUpperCase();
  return `${region}_${payload.gameId}`;
}
