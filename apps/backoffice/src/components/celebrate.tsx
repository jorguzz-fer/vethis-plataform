import { useEffect, useRef } from 'react';

// Cores festivas (marca Vethis + acentos).
const COLORS = [
  '#B58D4F',
  '#C9A461',
  '#14523A',
  '#3E7D5F',
  '#2f7d5b',
  '#60a5fa',
  '#d97878',
  '#F5ECDA',
];

/**
 * Confete de celebração. Toca uma explosão quando `trigger` muda (incrementa).
 * Canvas full-screen, sem interações e sem dependências.
 */
export function Celebrate({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rot: number;
      vrot: number;
    };
    const parts: P[] = [];
    const bursts = reduce
      ? [{ x: W * 0.5, y: H * 0.3 }]
      : [
          { x: W * 0.22, y: H * 0.32 },
          { x: W * 0.5, y: H * 0.24 },
          { x: W * 0.78, y: H * 0.32 },
        ];
    const perBurst = reduce ? 40 : 90;
    for (const b of bursts) {
      for (let i = 0; i < perBurst; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 8;
        parts.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 4,
          color: COLORS[i % COLORS.length]!,
          size: 5 + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.4,
        });
      }
    }

    const DURATION = 2600;
    let raf = 0;
    let start: number | null = null;

    function frame(t: number) {
      if (!ctx || !canvas) return;
      if (start === null) start = t;
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.17; // gravidade
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < DURATION) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true" />
  );
}
