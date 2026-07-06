import "server-only";

type ChampionData = Record<string, { id: string; key: string; name: string; image: { full: string } }>;
type SpellData = Record<string, { id: string; key: string; name: string; image: { full: string } }>;

let versionCache: string | null = null;
let championIdCache: Map<number, string> | null = null;
let spellIdCache: Map<number, string> | null = null;

export async function getDDragonVersion() {
  if (versionCache) return versionCache;
  const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    next: { revalidate: 60 * 60 * 12 },
  });
  const versions = (await response.json()) as string[];
  versionCache = versions[0] ?? "16.13.1";
  return versionCache;
}

export async function getChampionImageByKey(championName: string, version?: string) {
  const resolvedVersion = version ?? (await getDDragonVersion());
  return `https://ddragon.leagueoflegends.com/cdn/${resolvedVersion}/img/champion/${championName}.png`;
}

export async function getChampionIdMap(version?: string) {
  if (championIdCache) return championIdCache;
  const resolvedVersion = version ?? (await getDDragonVersion());
  const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${resolvedVersion}/data/ko_KR/champion.json`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  const json = (await response.json()) as { data: ChampionData };
  championIdCache = new Map(
    Object.values(json.data).map((champion) => [Number(champion.key), champion.image.full.replace(".png", "")]),
  );
  return championIdCache;
}

export async function getSpellIdMap(version?: string) {
  if (spellIdCache) return spellIdCache;
  const resolvedVersion = version ?? (await getDDragonVersion());
  const response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${resolvedVersion}/data/ko_KR/summoner.json`,
    { next: { revalidate: 60 * 60 * 12 } },
  );
  const json = (await response.json()) as { data: SpellData };
  spellIdCache = new Map(Object.values(json.data).map((spell) => [Number(spell.key), spell.image.full]));
  return spellIdCache;
}

export function profileIconUrl(iconId: number | null | undefined, version: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId ?? 29}.png`;
}

export function itemUrl(itemId: number, version: string) {
  return itemId > 0 ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png` : null;
}

export function spellUrl(spellFile: string | undefined, version: string) {
  return spellFile ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellFile}` : null;
}
