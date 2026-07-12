import { useEffect, useState } from 'react';
import { api, type Lead } from '../api';

const STAGES: Array<{ value: Lead['stage']; label: string }> = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
];

export function CrmPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  function load() {
    api
      .GET('/v1/admin/leads')
      .then(({ data }) => setLeads(data ?? []))
      .catch(() => setLeads([]));
  }
  useEffect(load, []);

  async function changeStage(lead: Lead, stage: Lead['stage']) {
    await api.PATCH('/v1/admin/leads/{id}', {
      params: { path: { id: lead.id } },
      body: { stage },
    });
    load();
  }

  if (leads === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-green-800">CRM — Leads</h1>
      {leads.length === 0 ? (
        <p className="text-muted">Nenhum lead ainda.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Origem</th>
                <th className="px-4 py-3 font-semibold">Estágio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-ink">{l.name}</td>
                  <td className="px-4 py-3 text-muted">{l.email}</td>
                  <td className="px-4 py-3 text-muted">{l.source}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.stage}
                      onChange={(e) => changeStage(l, e.target.value as Lead['stage'])}
                      className="rounded-md border border-border px-2 py-1 text-sm"
                    >
                      {STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
