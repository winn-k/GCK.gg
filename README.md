# GCK.gg

학교 친구 20명 안팎이 쓰는 작은 League of Legends 전적/내전 기록 사이트입니다. KR 서버를 기본값으로 쓰고, Riot ID(`gameName#tagLine`)를 PUUID로 변환한 뒤 전적을 캐시합니다. 내전은 Tournament Code를 발급하고 Riot callback 또는 수동 sync로 결과를 저장합니다.

배포는 `Vercel + Supabase Postgres + Prisma` 기준입니다.

## 실행

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 현재 기본 Prisma provider는 Postgres입니다. Supabase `DATABASE_URL`과 `DIRECT_URL`을 먼저 넣어야 DB 페이지가 정상 동작합니다.

## 환경 변수

`.env.example`을 참고하세요.

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?schema=public"
RIOT_API_KEY=""
RIOT_REGION_PLATFORM="kr"
RIOT_REGION_GROUP="asia"
RIOT_TOURNAMENT_PROVIDER_ID=""
RIOT_TOURNAMENT_ID=""
RIOT_TOURNAMENT_CALLBACK_URL="https://your-domain.com/api/riot/tournament-callback"
ADMIN_PASSWORD="change-me"
```

`RIOT_API_KEY`는 서버 코드에서만 읽습니다. 클라이언트 컴포넌트와 브라우저 응답에는 API key를 내려주지 않습니다.

## Supabase 설정

1. Supabase에서 새 프로젝트를 만듭니다.
2. Project Settings → Database → Connection string에서 아래 두 URL을 복사합니다.
3. `DATABASE_URL`에는 pooler/transaction mode URL을 넣습니다. Vercel 같은 서버리스 환경에서는 `pgbouncer=true&connection_limit=1`을 붙입니다.
4. `DIRECT_URL`에는 direct connection URL을 넣습니다. Prisma migration/schema push용입니다.
5. Supabase Data API를 쓰지 않고 Prisma만 쓸 계획이면 Supabase API Settings에서 Data API 노출을 꺼도 됩니다.

Supabase 공식 Prisma 문서도 같은 방향을 권장합니다: Prisma 전용 DB user를 만들 수 있고, 서버리스에서는 Supavisor transaction mode와 낮은 connection limit을 쓰는 것이 안전합니다.

## Vercel 배포

1. GitHub에 이 프로젝트를 push합니다.
2. Vercel에서 Import Project를 선택합니다.
3. Environment Variables에 `.env.example` 값들을 넣습니다.
4. 먼저 Supabase DB에 스키마를 반영합니다.

```bash
npm run prisma:push
```

운영 migration을 엄격하게 관리하려면:

```bash
npm run prisma:migrate -- --name init
npm run prisma:deploy
```

5. Vercel 배포 후 나온 URL을 Riot callback으로 씁니다.

```env
RIOT_TOURNAMENT_CALLBACK_URL="https://your-vercel-app.vercel.app/api/riot/tournament-callback"
```

6. Vercel 환경 변수의 `RIOT_TOURNAMENT_CALLBACK_URL`도 같은 값으로 바꾸고 재배포합니다.

## Riot Developer Portal 설정

1. Developer Portal에서 애플리케이션을 만들고 API key를 발급합니다.
2. Account-V1은 regional routing(`asia`), Summoner/League/Tournament는 platform routing(`kr`)을 사용합니다.
3. Tournament API 권한이 있는 키가 필요합니다. 권한이 없으면 코드 발급 API가 401/403을 반환하며 앱은 에러 메시지를 표시합니다.
4. callback URL은 외부에서 접근 가능한 HTTPS 주소여야 합니다. 예: `https://gck.example.com/api/riot/tournament-callback`
5. provider/tournament를 미리 발급했다면 `RIOT_TOURNAMENT_PROVIDER_ID`, `RIOT_TOURNAMENT_ID`에 넣어 재사용할 수 있습니다.

## 구현된 경로

- `/` Riot ID 검색, 최근 검색, 최근 내전
- `/summoners/kr/[gameName]/[tagLine]` 프로필, 랭크, 최근 경기
- `/matches/[matchId]` 10명 스코어보드
- `/scrims` 내전 목록
- `/scrims/new` 내전 생성 및 Tournament Code 발급
- `/scrims/[id]` 코드 상태, callback 상태, 경기 결과
- `/admin` 최근 내전과 Riot 요청 로그

## 서버 API

- `GET/POST /api/summoners/search`
- `POST /api/summoners/[puuid]/refresh`
- `GET /api/matches/[matchId]`
- `GET/POST /api/scrims`
- `POST /api/scrims/[id]/create-tournament-code`
- `POST /api/riot/tournament-callback`
- `POST /api/scrims/[id]/sync`

## 주의

Tournament callback은 200을 빠르게 반환하고, 상세 match fetch는 비동기 함수로 처리합니다. callback이 5분 이상 오지 않으면 `/scrims/[id]`의 수동 동기화를 사용하세요. Riot 429 응답은 `Retry-After`를 읽어 사용자에게 안내합니다.
