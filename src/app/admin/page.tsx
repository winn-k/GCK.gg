import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [scrims, logs] = await Promise.all([
    prisma.scrim.findMany({ orderBy: { updatedAt: "desc" }, take: 10 }),
    prisma.riotApiLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-black text-white">관리자</h1>
            <p className="text-sm text-slate-400">내전 상태와 Riot 요청 로그를 확인합니다.</p>
          </div>
        </div>
        <Link href="/scrims/new" className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200">
          내전 생성
        </Link>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
          <h2 className="font-black text-white">최근 내전</h2>
          <div className="mt-3 divide-y divide-white/10">
            {scrims.map((scrim) => (
              <Link key={scrim.id} href={`/scrims/${scrim.id}`} className="block py-3 text-slate-300 hover:text-cyan-200">
                <p className="font-semibold">{scrim.title}</p>
                <p className="text-sm text-slate-500">
                  {scrim.status} · {scrim.tournamentCode ?? "코드 없음"}
                </p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5">
          <h2 className="font-black text-white">Riot 요청 로그</h2>
          <div className="mt-3 divide-y divide-white/10">
            {logs.map((log) => (
              <div key={log.id} className="py-3">
                <p className="truncate text-sm font-semibold text-slate-300">{log.endpoint}</p>
                <p className="text-xs text-slate-500">
                  {log.status} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
