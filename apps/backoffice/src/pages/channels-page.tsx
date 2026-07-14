import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Field } from '@vethis/ui';
import { api, type Channel, type UnmappedOrigin } from '../api';

type Tab = 'canais' | 'utm' | 'unmapped';
type Group = Channel['group'];

const GROUP_LABEL: Record<Group, string> = {
  pago: 'Pago',
  organico: 'Orgânico',
  base_propria: 'Base própria',
};
const GROUPS: Group[] = ['pago', 'organico', 'base_propria'];

export function ChannelsPage() {
  const [tab, setTab] = useState<Tab>('canais');
  return (
    <div>
      <h1 className="mb-4 font-serif text-3xl font-semibold text-green-800">Canais de aquisição</h1>
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'canais'} onClick={() => setTab('canais')}>
          Canais
        </TabButton>
        <TabButton active={tab === 'utm'} onClick={() => setTab('utm')}>
          Construtor de UTM
        </TabButton>
        <TabButton active={tab === 'unmapped'} onClick={() => setTab('unmapped')}>
          Origens não mapeadas
        </TabButton>
      </div>
      {tab === 'canais' ? <ChannelsBoard /> : null}
      {tab === 'utm' ? <UtmBuilder /> : null}
      {tab === 'unmapped' ? <UnmappedBoard /> : null}
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
// Canais (CRUD)
// ---------------------------------------------------------------------------

function ChannelsBoard() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [modal, setModal] = useState(false);

  function load() {
    api
      .GET('/v1/admin/channels')
      .then(({ data }) => setChannels(data ?? []))
      .catch(() => setChannels([]));
  }
  useEffect(load, []);

  async function removeChannel(c: Channel) {
    if (!confirm(`Excluir o canal "${c.name}"?`)) return;
    await api.DELETE('/v1/admin/channels/{id}', { params: { path: { id: c.id } } });
    load();
  }
  async function removeRule(ruleId: string) {
    await api.DELETE('/v1/admin/channels/rules/{ruleId}', { params: { path: { ruleId } } });
    load();
  }
  async function addRule(channelId: string, utmSource: string, utmMedium: string) {
    if (!utmSource.trim()) return;
    await api.POST('/v1/admin/channels/{id}/rules', {
      params: { path: { id: channelId } },
      body: { utmSource: utmSource.trim(), utmMedium: utmMedium.trim() || null },
    });
    load();
  }

  if (channels === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          + Novo canal
        </Button>
      </div>

      {GROUPS.map((group) => {
        const items = channels.filter((c) => c.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
              {GROUP_LABEL[group]}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((c) => (
                <ChannelCard
                  key={c.id}
                  channel={c}
                  onEdit={() => {
                    setEditing(c);
                    setModal(true);
                  }}
                  onDelete={() => void removeChannel(c)}
                  onRemoveRule={removeRule}
                  onAddRule={addRule}
                />
              ))}
            </div>
          </div>
        );
      })}

      {modal ? (
        <ChannelModal
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function ChannelCard({
  channel,
  onEdit,
  onDelete,
  onRemoveRule,
  onAddRule,
}: {
  channel: Channel;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveRule: (ruleId: string) => void;
  onAddRule: (channelId: string, source: string, medium: string) => void;
}) {
  const [src, setSrc] = useState('');
  const [med, setMed] = useState('');
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: channel.color }} />
          <span className="font-semibold text-ink">{channel.name}</span>
          {!channel.active ? (
            <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-muted">
              inativo
            </span>
          ) : null}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="text" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="text" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {channel.rules.length === 0 ? (
          <span className="text-xs text-muted">Sem regras — não captura leads ainda.</span>
        ) : (
          channel.rules.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800"
            >
              {r.utmSource}
              {r.utmMedium ? ` · ${r.utmMedium}` : ''}
              <button
                type="button"
                onClick={() => onRemoveRule(r.id)}
                aria-label="Remover regra"
                className="text-green-700 hover:text-error"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          placeholder="utm_source"
          className="w-32 rounded-[8px] border-[1.5px] border-border px-2.5 py-1.5 text-sm"
        />
        <input
          value={med}
          onChange={(e) => setMed(e.target.value)}
          placeholder="utm_medium (opcional)"
          className="w-40 rounded-[8px] border-[1.5px] border-border px-2.5 py-1.5 text-sm"
        />
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            onAddRule(channel.id, src, med);
            setSrc('');
            setMed('');
          }}
          disabled={!src.trim()}
        >
          + Regra
        </Button>
      </div>
    </div>
  );
}

function ChannelModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Channel | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [group, setGroup] = useState<Group>(editing?.group ?? 'organico');
  const [color, setColor] = useState(editing?.color ?? '#3E7D5F');
  const [active, setActive] = useState(editing?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = editing
        ? await api.PATCH('/v1/admin/channels/{id}', {
            params: { path: { id: editing.id } },
            body: { name, group, color, active },
          })
        : await api.POST('/v1/admin/channels', { body: { name, group, color, active } });
      if (err) throw new Error();
      onSaved();
    } catch {
      setError('Não foi possível salvar. O nome pode já existir.');
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
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-serif text-xl font-semibold text-green-800">
          {editing ? 'Editar canal' : 'Novo canal'}
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Grupo
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as Group)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-ink">
            Cor
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 rounded border border-border"
            />
            <span className="font-normal text-muted">{color}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo
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
// Construtor de UTM
// ---------------------------------------------------------------------------

function UtmBuilder() {
  const [base, setBase] = useState('https://vethis.com.br');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams();
  const add = (k: string, v: string) => v.trim() && params.set(k, v.trim());
  add('utm_source', source);
  add('utm_medium', medium);
  add('utm_campaign', campaign);
  add('utm_content', content);
  add('utm_term', term);
  const qs = params.toString();
  const url = base.trim() ? `${base.trim()}${base.includes('?') ? '&' : '?'}${qs}` : '';

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-muted">
        Monte URLs padronizadas para os anúncios. Use os mesmos <code>utm_source</code>/
        <code>utm_medium</code> das regras dos canais para o lead cair no canal certo.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="URL base"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="sm:col-span-2"
        />
        <Field label="utm_source" value={source} onChange={(e) => setSource(e.target.value)} />
        <Field label="utm_medium" value={medium} onChange={(e) => setMedium(e.target.value)} />
        <Field
          label="utm_campaign"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />
        <Field label="utm_content" value={content} onChange={(e) => setContent(e.target.value)} />
        <Field label="utm_term" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <div className="mt-5 rounded-lg border border-border bg-green-50/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">URL gerada</p>
        <p className="break-all font-mono text-sm text-ink">{qs ? url : '—'}</p>
        <Button
          size="sm"
          className="mt-3"
          disabled={!qs}
          onClick={() => {
            void navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copiado!' : 'Copiar URL'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Origens não mapeadas
// ---------------------------------------------------------------------------

function UnmappedBoard() {
  const [rows, setRows] = useState<UnmappedOrigin[] | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  function load() {
    api
      .GET('/v1/admin/channels/unmapped-origins')
      .then(({ data }) => setRows(data ?? []))
      .catch(() => setRows([]));
  }
  useEffect(load, []);
  useEffect(() => {
    api.GET('/v1/admin/channels').then(({ data }) => setChannels(data ?? []));
  }, []);

  async function createRule(o: UnmappedOrigin, channelId: string) {
    if (!channelId || !o.utmSource) return;
    await api.POST('/v1/admin/channels/{id}/rules', {
      params: { path: { id: channelId } },
      body: { utmSource: o.utmSource, utmMedium: o.utmMedium },
    });
    load();
  }

  if (rows === null) return <p className="text-muted">Carregando…</p>;
  if (rows.length === 0) return <p className="text-muted">Nenhuma origem sem mapeamento. 🎯</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-green-50 text-green-800">
          <tr>
            <th className="px-4 py-3 font-semibold">utm_source</th>
            <th className="px-4 py-3 font-semibold">utm_medium</th>
            <th className="px-4 py-3 font-semibold">Leads</th>
            <th className="px-4 py-3 font-semibold">Mapear para</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((o, i) => (
            <tr key={`${o.utmSource}-${o.utmMedium}-${i}`}>
              <td className="px-4 py-3 font-medium text-ink">{o.utmSource ?? '—'}</td>
              <td className="px-4 py-3 text-muted">{o.utmMedium ?? '—'}</td>
              <td className="px-4 py-3 text-muted">{o.count}</td>
              <td className="px-4 py-3">
                <select
                  defaultValue=""
                  onChange={(e) => void createRule(o, e.target.value)}
                  className="rounded-[8px] border-[1.5px] border-border px-2 py-1.5 text-sm"
                >
                  <option value="">Criar regra em…</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
