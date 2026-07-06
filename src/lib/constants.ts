export const DEFAULT_PLATFORM = process.env.RIOT_REGION_PLATFORM ?? "kr";
export const DEFAULT_REGION_GROUP = process.env.RIOT_REGION_GROUP ?? "asia";
export const SEARCH_REFRESH_COOLDOWN_MS = 3 * 60 * 1000;

export const queueNames: Record<number, string> = {
  400: "일반 드래프트",
  420: "솔로랭크",
  430: "일반 비공개",
  440: "자유랭크",
  450: "칼바람",
  700: "격전",
};
