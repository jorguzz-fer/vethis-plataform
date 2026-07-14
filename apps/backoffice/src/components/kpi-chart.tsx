import { useState, type PointerEvent } from 'react';
import { formatBRL } from '@vethis/shared';
import type { MonthlyKpi } from '../api';

type Metric = 'enrollments' | 'revenue' | 'won';

const METRICS: Array<{
  key: Metric;
  label: string;
  title: string;
  money: boolean;
  get: (d: MonthlyKpi) => number;
}> = [
  {
    key: 'enrollments',
    label: 'Matrículas',
    title: 'Novas matrículas por mês',
    money: false,
    get: (d) => d.enrollments,
  },
  {
    key: 'revenue',
    label: 'Receita',
    title: 'Receita estimada por mês',
    money: true,
    get: (d) => d.revenueCents,
  },
  {
    key: 'won',
    label: 'Vendas',
    title: 'Oportunidades ganhas por mês',
    money: true,
    get: (d) => d.wonCents,
  },
];

// Geometria do gráfico (viewBox fixo; largura fluida via CSS).
const W = 720;
const H = 260;
const M = { top: 20, right: 20, bottom: 34, left: 52 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

// Marca Vethis: série única em verde (sem legenda — o título nomeia a série).
const LINE = '#14523A'; // green-700
const AREA = '#14523A';
const GRID = '#E2E1D8'; // border
const INK = '#16201B';
const MUTED = '#5C665F';

function niceMax(v: number): number {
  if (v <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function KpiChart({ data }: { data: MonthlyKpi[] }) {
  const [metric, setMetric] = useState<Metric>('enrollments');
  const [hover, setHover] = useState<number | null>(null);

  const active = METRICS.find((m) => m.key === metric)!;
  const values = data.map(active.get);
  const rawMax = Math.max(...values, 0);
  const yMax = active.money ? niceMax(rawMax / 100) * 100 : Math.max(niceMax(rawMax), 2); // contagem: ticks inteiros (evita "0,5")

  const n = data.length;
  const x = (i: number) => M.left + (n <= 1 ? PLOT_W / 2 : (PLOT_W * i) / (n - 1));
  const y = (v: number) => M.top + PLOT_H - (yMax === 0 ? 0 : (PLOT_H * v) / yMax);

  const pts = values.map((v, i) => ({ x: x(i), y: y(v), v, i }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${x(n - 1)} ${M.top + PLOT_H} L ${x(0)} ${M.top + PLOT_H} Z`;

  const fmt = (v: number) => (active.money ? formatBRL(v) : String(v));
  const fmtAxis = (v: number) => {
    if (!active.money) return String(Math.round(v));
    const k = v / 100 / 1000;
    if (k >= 1) return `R$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    return `R$${Math.round(v / 100)}`;
  };

  const gridVals = [0, yMax / 2, yMax];

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W; // client → viewBox
    const frac = (px - M.left) / PLOT_W;
    const idx = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    setHover(idx);
  }

  const hp = hover !== null ? pts[hover] : null;

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-lg font-semibold text-green-800">{active.title}</h3>
        <div className="flex rounded-lg border border-border p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                metric === m.key ? 'bg-green-700 text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={active.title}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="kpiArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AREA} stopOpacity="0.18" />
              <stop offset="100%" stopColor={AREA} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grade + rótulos do eixo Y (recessivos) */}
          {gridVals.map((gv, i) => (
            <g key={i}>
              <line
                x1={M.left}
                y1={y(gv)}
                x2={W - M.right}
                y2={y(gv)}
                stroke={GRID}
                strokeWidth="1"
              />
              <text x={M.left - 8} y={y(gv) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
                {fmtAxis(gv)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#kpiArea)" />
          <path d={linePath} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />

          {/* rótulos do eixo X */}
          {data.map((d, i) => (
            <text key={d.month} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED}>
              {d.label}
            </text>
          ))}

          {/* rótulo direto no último ponto */}
          {pts.length > 0 ? (
            <text
              x={x(n - 1)}
              y={y(values[n - 1] ?? 0) - 10}
              textAnchor="end"
              fontSize="12"
              fontWeight="600"
              fill={INK}
            >
              {fmt(values[n - 1] ?? 0)}
            </text>
          ) : null}

          {/* crosshair + ponto no hover */}
          {hp ? (
            <g>
              <line
                x1={hp.x}
                y1={M.top}
                x2={hp.x}
                y2={M.top + PLOT_H}
                stroke={GRID}
                strokeWidth="1"
              />
              <circle cx={hp.x} cy={hp.y} r="5" fill={LINE} stroke="#fff" strokeWidth="2" />
            </g>
          ) : null}
        </svg>

        {hp ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-border bg-white px-2 py-1 text-xs shadow-md"
            style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}
          >
            <span className="font-semibold text-ink">{fmt(hp.v)}</span>{' '}
            <span className="text-muted">· {data[hp.i]?.label}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
