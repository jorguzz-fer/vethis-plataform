import { useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Field } from '@vethis/ui';
import { api, type SecretariaRequest } from '../api';

const STATUS_LABEL: Record<SecretariaRequest['status'], string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  resolved: 'Resolvida',
};

export function SecretariaPage() {
  const [items, setItems] = useState<SecretariaRequest[]>([]);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('documentos');
  const [busy, setBusy] = useState(false);

  function load() {
    api
      .GET('/v1/me/secretaria')
      .then(({ data }) => setItems(data ?? []))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setBusy(true);
    try {
      await api.POST('/v1/me/secretaria', { body: { type, subject } });
      setSubject('');
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-green-800">Secretaria online</h1>

      <form
        onSubmit={onSubmit}
        className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-white p-4"
      >
        <Field
          label="Assunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-ink">
            Tipo
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              <option value="documentos">Documentos</option>
              <option value="suporte">Suporte</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Abrir solicitação'}
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-muted">Nenhuma solicitação ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
            >
              <div>
                <span className="text-xs uppercase tracking-wide text-muted">{r.type}</span>
                <p className="font-medium text-ink">{r.subject}</p>
              </div>
              <Badge variant={r.status === 'resolved' ? 'category' : 'highlight'}>
                {STATUS_LABEL[r.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
