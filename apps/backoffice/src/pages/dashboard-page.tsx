import { useEffect, useState } from 'react';
import { formatBRL } from '@vethis/shared';
import { api, type Kpis } from '../api';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-green-800">{value}</p>
    </div>
  );
}

const STAGE_LABEL: Record<keyof Kpis['leadsByStage'], string> = {
  new: 'Novos',
  contacted: 'Contatados',
  qualified: 'Qualificados',
  won: 'Ganhos',
  lost: 'Perdidos',
};

export function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .GET('/v1/admin/kpis')
      .then(({ data, error }) => (error || !data ? setError(true) : setKpis(data)))
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-muted">Não foi possível carregar os KPIs.</p>;
  if (!kpis) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-green-800">Painel</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Card label="Alunos" value={String(kpis.students)} />
        <Card label="Matrículas ativas" value={String(kpis.activeEnrollments)} />
        <Card label="Cursos publicados" value={String(kpis.publishedCourses)} />
        <Card label="Taxa de conclusão" value={`${Math.round(kpis.completionRate * 100)}%`} />
        <Card label="Receita estimada" value={formatBRL(kpis.estimatedRevenueCents)} />
      </div>

      <h2 className="mb-3 mt-10 font-serif text-xl font-semibold text-green-800">Funil de leads</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(Object.keys(kpis.leadsByStage) as Array<keyof Kpis['leadsByStage']>).map((stage) => (
          <div key={stage} className="rounded-lg border border-border bg-white p-4 text-center">
            <p className="font-serif text-xl font-semibold text-gold-600">
              {kpis.leadsByStage[stage]}
            </p>
            <p className="text-xs text-muted">{STAGE_LABEL[stage]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
