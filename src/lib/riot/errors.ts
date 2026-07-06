export class RiotApiError extends Error {
  status: number;
  retryAfter?: number;
  details?: unknown;

  constructor(message: string, status: number, retryAfter?: number, details?: unknown) {
    super(message);
    this.name = "RiotApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.details = details;
  }
}

export function riotErrorMessage(error: unknown) {
  if (error instanceof RiotApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Riot API key가 없거나 권한이 없습니다. .env의 RIOT_API_KEY와 Tournament API 권한을 확인하세요.";
    }
    if (error.status === 404) {
      return "Riot에서 해당 데이터를 찾지 못했습니다.";
    }
    if (error.status === 429) {
      return `Riot API rate limit에 걸렸습니다. ${error.retryAfter ?? 60}초 뒤 다시 시도하세요.`;
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
}
