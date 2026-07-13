import { useEffect, useState, type DragEvent } from 'react';
import { api, type Lead } from '../api';

type Stage = Lead['stage'];

const STAGES: Array<{ value: Stage; label: string; color: string }> = [
  { value: 'new', label: 'Novo', color: '#94a3b8' },
  { value: 'contacted', label: 'Contatado', color: '#60a5fa' },
  { value: 'qualified', label: 'Qualificado', color: '#c9a24b' },
  { value: 'won', label: 'Ganho', color: '#2f7d5b' },
  { value: 'lost', label: 'Perdido', color: '#d97878' },
];

export function CrmPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  useEffect(() => {
    api
      .GET('/v1/admin/leads')
      .then(({ data }) => setLeads(data ?? []))
      .catch(() => setLeads([]));
  }, []);

  async function moveTo(id: string, stage: Stage) {
    setLeads((prev) => prev?.map((l) => (l.id === id ? { ...l, stage } : l)) ?? prev);
    const { error } = await api.PATCH('/v1/admin/leads/{id}', {
      params: { path: { id } },
      body: { stage },
    });
    if (error) {
      // Reverte recarregando em caso de falha.
      const { data } = await api.GET('/v1/admin/leads');
      setLeads(data ?? []);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>, stage: Stage) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const lead = leads?.find((l) => l.id === id);
    if (id && lead && lead.stage !== stage) void moveTo(id, stage);
  }

  if (leads === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-serif text-3xl font-semibold text-green-800">CRM — Funil</h1>
        <span className="text-sm text-muted">
          {leads.length} leads · arraste os cards entre as colunas
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.value);
          const isOver = dragOver === stage.value;
          return (
            <div
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.value);
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.value ? null : s))}
              onDrop={(e) => onDrop(e, stage.value)}
              className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
                isOver ? 'border-green-700 bg-green-50' : 'border-border bg-paper/60'
              }`}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h2 className="text-sm font-bold text-ink">{stage.label}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} onMove={moveTo} />
                ))}
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                    Solte um lead aqui
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, s: Stage) => void }) {
  const idx = STAGES.findIndex((s) => s.value === lead.stage);
  const prev = STAGES[idx - 1];
  const next = STAGES[idx + 1];
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded-lg border border-border bg-white p-3 shadow-[0_1px_2px_rgba(10,31,25,.06)] active:cursor-grabbing"
    >
      <p className="text-sm font-semibold text-ink">{lead.name}</p>
      <p className="truncate text-xs text-muted">{lead.email}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
          {lead.source}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && onMove(lead.id, prev.value)}
            className="grid h-6 w-6 place-items-center rounded border border-border text-muted hover:enabled:border-green-700 hover:enabled:text-green-700 disabled:opacity-30"
            aria-label="Estágio anterior"
            title={prev ? `Mover para ${prev.label}` : ''}
          >
            ‹
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && onMove(lead.id, next.value)}
            className="grid h-6 w-6 place-items-center rounded border border-border text-muted hover:enabled:border-green-700 hover:enabled:text-green-700 disabled:opacity-30"
            aria-label="Próximo estágio"
            title={next ? `Mover para ${next.label}` : ''}
          >
            ›
          </button>
        </div>
      </div>
    </article>
  );
}
