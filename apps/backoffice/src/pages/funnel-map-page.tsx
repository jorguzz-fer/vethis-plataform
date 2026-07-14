import { useEffect, useMemo, useState } from 'react';
import { api, type Kpis } from '../api';

/**
 * Mapa de fluxo (experimental) — jornada ponta a ponta:
 * Canais → Qualificação (SDR·IA) → CRM → Matrícula → Aluno.
 * As conexões têm fluxo animado (traços + partículas). Os nós de CRM,
 * matrícula e alunos usam dados reais; os canais são o template de aquisição.
 */

const GROUPS = [
  {
    key: 'pago',
    label: 'Pago',
    color: '#B58D4F',
    channels: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn'],
  },
  {
    key: 'organico',
    label: 'Orgânico',
    color: '#3E7D5F',
    channels: ['Landing pages', 'Blog', 'Instagram', 'E-mail mkt', 'Quiz vocacional'],
  },
  {
    key: 'base',
    label: 'Base própria',
    color: '#2B6CB0',
    channels: ['Base própria', 'Upsell', 'Egressos', 'Cross-sell'],
  },
];

const CRM_STAGES: Array<{ key: keyof Kpis['leadsByStage']; label: string; color: string }> = [
  { key: 'new', label: 'Novo', color: '#94a3b8' },
  { key: 'contacted', label: 'Contatado', color: '#60a5fa' },
  { key: 'qualified', label: 'Qualificado', color: '#B58D4F' },
  { key: 'won', label: 'Ganho', color: '#2f7d5b' },
  { key: 'lost', label: 'Perdido', color: '#d97878' },
];

// Geometria (viewBox fixo; largura fluida com scroll horizontal).
const VW = 1360;
const TOP = 52;
const CHIP_X = 96;
const CHIP_W = 158;
const CHIP_H = 28;
const CHIP_GAP = 9;
const GROUP_GAP = 24;
const SDR_X = 420;
const SDR_W = 150;
const SDR_H = 92;
const CRM_X = 690;
const CRM_W = 208;
const ENROLL_X = 982;
const STUDENT_X = 1194;
const NODE_W = 134;
const NODE_H = 78;

export function FunnelMapPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    api
      .GET('/v1/admin/kpis')
      .then(({ data }) => setKpis(data ?? null))
      .catch(() => setKpis(null));
  }, []);

  const layout = useMemo(() => {
    let y = TOP;
    const chips: Array<{ label: string; color: string; y: number }> = [];
    const groups: Array<{ label: string; color: string; y: number }> = [];
    for (const g of GROUPS) {
      const start = y;
      for (const c of g.channels) {
        chips.push({ label: c, color: g.color, y: y + CHIP_H / 2 });
        y += CHIP_H + CHIP_GAP;
      }
      groups.push({ label: g.label, color: g.color, y: (start + (y - CHIP_GAP)) / 2 });
      y += GROUP_GAP;
    }
    return { chips, groups, bottom: y - GROUP_GAP };
  }, []);

  const midY = (TOP + layout.bottom) / 2;
  const VH = layout.bottom + 40;

  const leads = kpis?.leadsByStage;
  const totalLeads = leads
    ? leads.new + leads.contacted + leads.qualified + leads.won + leads.lost
    : 0;
  const qualified = leads ? leads.qualified + leads.won : 0;
  const won = leads?.won ?? 0;
  const maxStage = leads ? Math.max(1, ...CRM_STAGES.map((s) => leads[s.key])) : 1;
  const enrollments = kpis?.activeEnrollments ?? 0;
  const students = kpis?.students ?? 0;

  const chipPath = (cy: number) =>
    `M ${CHIP_X + CHIP_W} ${cy} C ${CHIP_X + CHIP_W + 120} ${cy}, ${SDR_X - 110} ${midY}, ${SDR_X} ${midY}`;
  const straight = (x1: number, x2: number) =>
    `M ${x1} ${midY} C ${x1 + 40} ${midY}, ${x2 - 40} ${midY}, ${x2} ${midY}`;

  return (
    <div>
      <style>{`
        @keyframes vethis-flow { to { stroke-dashoffset: -20; } }
        .fmap-flow { stroke-dasharray: 3 7; animation: vethis-flow .9s linear infinite; }
      `}</style>

      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold text-green-800">Fluxo de aquisição</h1>
        <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-600">
          experimental
        </span>
      </div>
      <p className="mb-5 text-sm text-muted">
        Jornada ponta a ponta: canais → qualificação (SDR por IA) → CRM → matrícula → aluno. As
        conexões mostram o fluxo; os nós de CRM, matrícula e alunos usam dados reais.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <FlowStat label="Leads no funil" value={totalLeads} color="#14523A" />
        <FlowStat label="Qualificados" value={qualified} color="#B58D4F" />
        <FlowStat label="Ganhos" value={won} color="#2f7d5b" />
        <FlowStat label="Matrículas ativas" value={enrollments} color="#3E7D5F" />
        <FlowStat label="Alunos" value={students} color="#0B3D2A" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="min-w-[1080px]"
          role="img"
          aria-label="Mapa de fluxo de aquisição de leads"
        >
          <defs>
            <pattern id="fmap-grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#EEF1EC" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={VW} height={VH} fill="url(#fmap-grid)" />

          {layout.groups.map((g) => (
            <text key={g.label} x={24} y={g.y + 4} fontSize="12" fontWeight="700" fill={g.color}>
              {g.label}
            </text>
          ))}

          {/* canal → SDR */}
          {layout.chips.map((c, i) => (
            <g key={`edge-${i}`}>
              <path
                id={`fmap-p${i}`}
                d={chipPath(c.y)}
                fill="none"
                stroke={c.color}
                strokeOpacity="0.5"
                strokeWidth="1.5"
                className="fmap-flow"
              />
              <circle r="3" fill={c.color}>
                <animateMotion dur="3s" begin={`${(i % 6) * 0.42}s`} repeatCount="indefinite">
                  <mpath href={`#fmap-p${i}`} />
                </animateMotion>
              </circle>
            </g>
          ))}

          {/* SDR → CRM → Matrícula → Aluno (trilha principal) */}
          {[
            { id: 'sdr-crm', d: straight(SDR_X + SDR_W, CRM_X) },
            { id: 'crm-enr', d: straight(CRM_X + CRM_W, ENROLL_X) },
            { id: 'enr-stu', d: straight(ENROLL_X + NODE_W, STUDENT_X) },
          ].map((seg) => (
            <g key={seg.id}>
              <path
                id={`fmap-${seg.id}`}
                d={seg.d}
                fill="none"
                stroke="#14523A"
                strokeOpacity="0.6"
                strokeWidth="2.5"
                className="fmap-flow"
              />
              {[0, 1, 2].map((k) => (
                <circle key={k} r="3.5" fill="#14523A">
                  <animateMotion dur="1.8s" begin={`${k * 0.6}s`} repeatCount="indefinite">
                    <mpath href={`#fmap-${seg.id}`} />
                  </animateMotion>
                </circle>
              ))}
            </g>
          ))}

          {/* chips */}
          {layout.chips.map((c, i) => (
            <g key={`chip-${i}`}>
              <rect
                x={CHIP_X}
                y={c.y - CHIP_H / 2}
                width={CHIP_W}
                height={CHIP_H}
                rx="7"
                fill="#fff"
                stroke={c.color}
                strokeOpacity="0.55"
                strokeWidth="1.5"
              />
              <circle cx={CHIP_X + 14} cy={c.y} r="3.5" fill={c.color} />
              <text x={CHIP_X + 26} y={c.y + 4} fontSize="12" fill="#16201B">
                {c.label}
              </text>
            </g>
          ))}

          {/* SDR / IA */}
          <g>
            <rect
              x={SDR_X}
              y={midY - SDR_H / 2}
              width={SDR_W}
              height={SDR_H}
              rx="14"
              fill="#EAF3EE"
              stroke="#14523A"
              strokeWidth="2"
            />
            <rect x={SDR_X + 16} y={midY - 26} width="64" height="18" rx="9" fill="#B58D4F" />
            <text
              x={SDR_X + 48}
              y={midY - 13}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#fff"
            >
              SDR · IA
            </text>
            <text
              x={SDR_X + SDR_W / 2}
              y={midY + 8}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#14523A"
            >
              Qualificação
            </text>
            <text
              x={SDR_X + SDR_W / 2}
              y={midY + 26}
              textAnchor="middle"
              fontSize="11"
              fill="#5C665F"
            >
              triagem automática
            </text>
          </g>

          {/* CRM · Funil (dados reais) */}
          {(() => {
            const rowH = 26;
            const headH = 40;
            const cardH = headH + CRM_STAGES.length * rowH + 16;
            const cardY = midY - cardH / 2;
            const barX = CRM_X + 92;
            const barMaxW = CRM_W - 104;
            return (
              <g>
                <rect
                  x={CRM_X}
                  y={cardY}
                  width={CRM_W}
                  height={cardH}
                  rx="14"
                  fill="#fff"
                  stroke="#14523A"
                  strokeWidth="2"
                />
                <text x={CRM_X + 16} y={cardY + 25} fontSize="15" fontWeight="700" fill="#14523A">
                  CRM · Funil
                </text>
                {CRM_STAGES.map((s, i) => {
                  const v = leads ? leads[s.key] : 0;
                  const ry = cardY + headH + i * rowH;
                  const w = Math.max(4, (barMaxW * v) / maxStage);
                  return (
                    <g key={s.key}>
                      <text x={CRM_X + 16} y={ry + 13} fontSize="11" fill="#5C665F">
                        {s.label}
                      </text>
                      <rect x={barX} y={ry + 4} width={barMaxW} height="10" rx="5" fill="#F1F0EA" />
                      <rect x={barX} y={ry + 4} width={w} height="10" rx="5" fill={s.color} />
                      <text
                        x={CRM_X + CRM_W - 12}
                        y={ry + 13}
                        textAnchor="end"
                        fontSize="11"
                        fontWeight="600"
                        fill="#16201B"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Matrícula + Aluno (dados reais) */}
          <StepNode x={ENROLL_X} y={midY} label="Matrícula" value={enrollments} accent="#3E7D5F" />
          <StepNode x={STUDENT_X} y={midY} label="Aluno" value={students} accent="#0B3D2A" />
        </svg>
      </div>
    </div>
  );
}

function StepNode({
  x,
  y,
  label,
  value,
  accent,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx="14"
        fill="#fff"
        stroke={accent}
        strokeWidth="2"
      />
      <text
        x={x + NODE_W / 2}
        y={y - 4}
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill={accent}
      >
        {value}
      </text>
      <text x={x + NODE_W / 2} y={y + 20} textAnchor="middle" fontSize="12" fill="#5C665F">
        {label}
      </text>
    </g>
  );
}

function FlowStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="font-serif text-xl font-semibold text-green-800">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
