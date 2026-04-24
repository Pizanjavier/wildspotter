import { useEffect, useState } from 'preact/hooks';

interface Props {
  label: string;
}

export const PioneerCounter = ({ label }: Props) => {
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

  const taken = count ?? 0;

  if (taken === 0) return null;

  return (
    <div class="inline-flex items-baseline gap-2">
      <span class={`font-sans font-black text-[22px] md:text-[26px] text-[#F5EBD8] ${pulse ? 'pulse-amber' : ''}`}>
        {taken}
      </span>
      <span class="text-[13px] font-normal text-[#B7A089] uppercase tracking-[0.1em]">{label}</span>
    </div>
  );
};
