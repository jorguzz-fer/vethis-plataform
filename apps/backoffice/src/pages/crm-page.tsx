import { useEffect, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Button, Field } from '@vethis/ui';
import { formatBRL } from '@vethis/shared';
import { api, type AdminUser, type Lead, type Opportunity } from '../api';

type Tab = 'leads' | 'opportunities';

export function CrmPage() {
  const [tab, setTab] = useState<Tab>('leads');
  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'leads'} onClick={() => setTab('leads')}>
          Leads
        </TabButton>
        <TabButton active={tab === 'opportunities'} onClick={() => setTab('opportunities')}>
          Oportunidades
        </TabButton>
      </div>
      {tab === 'leads' ? <LeadsBoard /> : <OpportunitiesBoard />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'border-green-700 text-green-800' : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Leads (funil de captação)
// ---------------------------------------------------------------------------

type LeadStage = Lead['stage'];

const LEAD_STAGES: Array<{ value: LeadStage; label: string; color: string }> = [
  { value: 'new', label: 'Novo', color: '#94a3b8' },
  { value: 'contacted', label: 'Contatado', color: '#60a5fa' },
  { value: 'qualified', label: 'Qualificado', color: '#c9a24b' },
  { value: 'won', label: 'Ganho', color: '#2f7d5b' },
  { value: 'lost', label: 'Perdido', color: '#d97878' },
];

function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);

  useEffect(() => {
    api
      .GET('/v1/admin/leads')
      .then(({ data }) => setLeads(data ?? []))
      .catch(() => setLeads([]));
  }, []);

  async function moveTo(id: string, stage: LeadStage) {
    setLeads((prev) => prev?.map((l) => (l.id === id ? { ...l, stage } : l)) ?? prev);
    const { error } = await api.PATCH('/v1/admin/leads/{id}', {
      params: { path: { id } },
      body: { stage },
    });
    if (error) {
      const { data } = await api.GET('/v1/admin/leads');
      setLeads(data ?? []);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>, stage: LeadStage) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const lead = leads?.find((l) => l.id === id);
    if (id && lead && lead.stage !== stage) void moveTo(id, stage);
  }

  if (leads === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-serif text-2xl font-semibold text-green-800">Funil de leads</h1>
        <span className="text-sm text-muted">
          {leads.length} leads · arraste os cards entre as colunas
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES.map((stage) => {
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
              <ColumnHeader color={stage.color} label={stage.label} count={items.length} />
              <div className="flex flex-1 flex-col gap-2">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} onMove={moveTo} />
                ))}
                {items.length === 0 ? <EmptyDrop label="Solte um lead aqui" /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, s: LeadStage) => void }) {
  const idx = LEAD_STAGES.findIndex((s) => s.value === lead.stage);
  const prev = LEAD_STAGES[idx - 1];
  const next = LEAD_STAGES[idx + 1];
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
        <StageArrows
          onPrev={prev ? () => onMove(lead.id, prev.value) : undefined}
          onNext={next ? () => onMove(lead.id, next.value) : undefined}
          prevLabel={prev?.label}
          nextLabel={next?.label}
        />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Oportunidades (funil de vendas)
// ---------------------------------------------------------------------------

type OppStage = Opportunity['stage'];

const OPP_STAGES: Array<{ value: OppStage; label: string; color: string }> = [
  { value: 'prospeccao', label: 'Prospecção', color: '#94a3b8' },
  { value: 'qualificacao', label: 'Qualificação', color: '#60a5fa' },
  { value: 'proposta', label: 'Proposta', color: '#c9a24b' },
  { value: 'negociacao', label: 'Negociação', color: '#a78bfa' },
  { value: 'ganho', label: 'Ganho', color: '#2f7d5b' },
  { value: 'perdido', label: 'Perdido', color: '#d97878' },
];

function OpportunitiesBoard() {
  const [opps, setOpps] = useState<Opportunity[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [owners, setOwners] = useState<AdminUser[]>([]);
  const [dragOver, setDragOver] = useState<OppStage | null>(null);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    api
      .GET('/v1/admin/opportunities')
      .then(({ data }) => setOpps(data ?? []))
      .catch(() => setOpps([]));
  }
  useEffect(load, []);
  useEffect(() => {
    api.GET('/v1/admin/leads').then(({ data }) => setLeads(data ?? []));
    api
      .GET('/v1/admin/users')
      .then(({ data }) => setOwners((data ?? []).filter((u) => u.role !== 'aluno')));
  }, []);

  async function moveTo(id: string, stage: OppStage) {
    setOpps((prev) => prev?.map((o) => (o.id === id ? { ...o, stage } : o)) ?? prev);
    const { error } = await api.PATCH('/v1/admin/opportunities/{id}', {
      params: { path: { id } },
      body: { stage },
    });
    if (error) load();
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta oportunidade?')) return;
    await api.DELETE('/v1/admin/opportunities/{id}', { params: { path: { id } } });
    load();
  }

  function onDrop(e: DragEvent<HTMLDivElement>, stage: OppStage) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const opp = opps?.find((o) => o.id === id);
    if (id && opp && opp.stage !== stage) void moveTo(id, stage);
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(o: Opportunity) {
    setEditing(o);
    setModalOpen(true);
  }

  if (opps === null) return <p className="text-muted">Carregando…</p>;

  const total = opps.reduce((s, o) => s + o.valueCents, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-green-800">Funil de vendas</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {opps.length} oportunidades · {formatBRL(total)}
          </span>
          <Button size="sm" onClick={openNew}>
            + Nova oportunidade
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {OPP_STAGES.map((stage) => {
          const items = opps.filter((o) => o.stage === stage.value);
          const isOver = dragOver === stage.value;
          const colTotal = items.reduce((s, o) => s + o.valueCents, 0);
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
              <ColumnHeader color={stage.color} label={stage.label} count={items.length} />
              {items.length > 0 ? (
                <p className="mb-2 px-1 text-[11px] font-medium text-muted">
                  {formatBRL(colTotal)}
                </p>
              ) : null}
              <div className="flex flex-1 flex-col gap-2">
                {items.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opp={o}
                    onMove={moveTo}
                    onEdit={() => openEdit(o)}
                    onDelete={() => void remove(o.id)}
                  />
                ))}
                {items.length === 0 ? <EmptyDrop label="Solte aqui" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen ? (
        <OpportunityModal
          editing={editing}
          leads={leads}
          owners={owners}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function OpportunityCard({
  opp,
  onMove,
  onEdit,
  onDelete,
}: {
  opp: Opportunity;
  onMove: (id: string, s: OppStage) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const idx = OPP_STAGES.findIndex((s) => s.value === opp.stage);
  const prev = OPP_STAGES[idx - 1];
  const next = OPP_STAGES[idx + 1];
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', opp.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded-lg border border-border bg-white p-3 shadow-[0_1px_2px_rgba(10,31,25,.06)] active:cursor-grabbing"
    >
      <p className="text-sm font-semibold text-ink">{opp.title}</p>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-green-800">{formatBRL(opp.valueCents)}</span>
        <span className="text-muted">{opp.probability}%</span>
      </div>
      {opp.ownerName || opp.leadName ? (
        <p className="mt-1 truncate text-[11px] text-muted">
          {opp.ownerName ? `👤 ${opp.ownerName}` : ''}
          {opp.ownerName && opp.leadName ? ' · ' : ''}
          {opp.leadName ? `🔗 ${opp.leadName}` : ''}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-medium text-green-700 hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] font-medium text-muted hover:text-error"
          >
            Excluir
          </button>
        </div>
        <StageArrows
          onPrev={prev ? () => onMove(opp.id, prev.value) : undefined}
          onNext={next ? () => onMove(opp.id, next.value) : undefined}
          prevLabel={prev?.label}
          nextLabel={next?.label}
        />
      </div>
    </article>
  );
}

function OpportunityModal({
  editing,
  leads,
  owners,
  onClose,
  onSaved,
}: {
  editing: Opportunity | null;
  leads: Lead[];
  owners: AdminUser[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [stage, setStage] = useState<OppStage | ''>(editing?.stage ?? '');
  const [valueReais, setValueReais] = useState(
    editing ? (editing.valueCents / 100).toFixed(2) : '',
  );
  const [probability, setProbability] = useState(String(editing?.probability ?? 0));
  const [closeDate, setCloseDate] = useState(editing?.expectedCloseDate ?? '');
  const [leadId, setLeadId] = useState(editing?.leadId ?? '');
  const [ownerId, setOwnerId] = useState(editing?.ownerId ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!stage) {
      setError('Selecione um estágio.');
      return;
    }
    setBusy(true);
    setError(null);
    const valueCents = Math.round(parseFloat(valueReais.replace(',', '.') || '0') * 100);
    const body = {
      title,
      stage,
      valueCents: Number.isFinite(valueCents) ? valueCents : 0,
      probability: Math.max(0, Math.min(100, parseInt(probability || '0', 10))),
      expectedCloseDate: closeDate || null,
      leadId: leadId || null,
      ownerId: ownerId || null,
    };
    try {
      const { error: err } = editing
        ? await api.PATCH('/v1/admin/opportunities/{id}', {
            params: { path: { id: editing.id } },
            body,
          })
        : await api.POST('/v1/admin/opportunities', { body });
      if (err) throw new Error();
      onSaved();
    } catch {
      setError('Não foi possível salvar. Verifique os campos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-green-800">
            {editing ? 'Editar oportunidade' : 'Nova oportunidade'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-2xl leading-none text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Proposta para Clínica X"
            required
          />

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Estágio
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as OppStage)}
              required
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              <option value="">Selecione…</option>
              {OPP_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Valor (R$)"
              inputMode="decimal"
              value={valueReais}
              onChange={(e) => setValueReais(e.target.value)}
              placeholder="1.000,00"
            />
            <Field
              label="Probabilidade %"
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
            />
          </div>

          <Field
            label="Previsão de fechamento"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
          />

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Lead relacionado
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              <option value="">Nenhum</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.email}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Responsável
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              <option value="">Sem responsável</option>
              {owners.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compartilhados
// ---------------------------------------------------------------------------

function ColumnHeader({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <h2 className="text-sm font-bold text-ink">{label}</h2>
      <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">
        {count}
      </span>
    </div>
  );
}

function EmptyDrop({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
      {label}
    </p>
  );
}

function StageArrows({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={!onPrev}
        onClick={onPrev}
        className="grid h-6 w-6 place-items-center rounded border border-border text-muted hover:enabled:border-green-700 hover:enabled:text-green-700 disabled:opacity-30"
        aria-label="Estágio anterior"
        title={prevLabel ? `Mover para ${prevLabel}` : ''}
      >
        ‹
      </button>
      <button
        type="button"
        disabled={!onNext}
        onClick={onNext}
        className="grid h-6 w-6 place-items-center rounded border border-border text-muted hover:enabled:border-green-700 hover:enabled:text-green-700 disabled:opacity-30"
        aria-label="Próximo estágio"
        title={nextLabel ? `Mover para ${nextLabel}` : ''}
      >
        ›
      </button>
    </div>
  );
}
