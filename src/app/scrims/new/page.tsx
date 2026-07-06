import { BackButton } from "@/components/back-button";
import { ScrimNewForm } from "@/components/scrim-new-form";

export const dynamic = "force-dynamic";

export default function NewScrimPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-4">
        <BackButton fallback="/scrims" />
      </div>
      <div className="rounded-lg border border-white/10 bg-[#0d1320] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Scrim Room</p>
        <h1 className="mt-2 text-2xl font-black text-white">내전 경기 생성</h1>
        <p className="mt-1 text-sm text-slate-400">코드는 한 경기용으로 발급됩니다. 실제 callback URL은 공개 HTTPS 주소가 필요합니다.</p>
        <div className="mt-5">
          <ScrimNewForm />
        </div>
      </div>
    </main>
  );
}
