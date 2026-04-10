import { useEffect, useState } from 'preact/hooks';

interface Props {
  label: string;
  cap?: number;
}

export const PioneerCounter = ({ label, cap = 500 }: Props) => {
  const [count, setCount] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let prev: number | null = null;
    const load = async () => {
      try {
        const res = await fetch('/api/pioneer-count', { headers: { 'cache-control': 'no-cache' } });
        const data = (await res.json().catch(() => ({}))) as { count?: number };
        if (typeof data.count === 'number') {
          if (prev !== null && data.count !== prev) {
            setPulse(true);
            setTimeout(() => setPulse(false), 1200);
          }
          prev = data.count;
          setCount(data.count);
        }
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const taken = count ?? 347;
  const left = Math.max(0, cap - taken);
  const pct = Math.min(100, Math.round((taken / cap) * 100));

  return (
    <div class="inline-flex flex-col gap-2 max-w-[360px]">
      <div class="flex items-baseline justify-between gap-4">
        <span class={`font-sans font-black text-[22px] md:text-[26px] text-[#F5EBD8] ${pulse ? 'pulse-amber' : ''}`}>
          {left} <span class="ml-2 text-[13px] font-normal text-[#B7A089] uppercase tracking-[0.1em]">{label}</span>
        </span>
        <span class="font-mono text-[11px] text-[#B7A089] tabular-nums">{taken}/{cap}</span>
      </div>
      <div class="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
