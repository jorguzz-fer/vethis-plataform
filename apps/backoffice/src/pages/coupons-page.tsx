import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Field } from '@vethis/ui';
import { formatBRL } from '@vethis/shared';
import { api, type AdminCoupon, type AdminCourse } from '../api';

type DiscountType = 'percent' | 'fixed';

/** Data YYYY-MM-DD (horário de Brasília) de um instante ISO, para o input de data. */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Sem validade';
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** "1.500,50" ou "1500.50" → 1500.5 (vírgula, quando houver, é o decimal). */
function parseReais(v: string): number {
  const t = v.trim();
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
}

function discountLabel(c: Pick<AdminCoupon, 'discountType' | 'discountValue'>): string {
  return c.discountType === 'percent' ? `${c.discountValue}%` : formatBRL(c.discountValue);
}

/** Mensagem da API (ex.: 409 "Já existe um cupom…") ou um texto genérico. */
function apiMessage(err: unknown, fallback: string): string {
  const body = err as { message?: string | string[] } | undefined;
  const msg = Array.isArray(body?.message) ? body?.message.join('; ') : body?.message;
  return msg || fallback;
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);

  function load() {
    api
      .GET('/v1/admin/coupons')
      .then(({ data }) => setCoupons(data ?? []))
      .catch(() => setCoupons([]));
  }
  useEffect(() => {
    load();
    api
      .GET('/v1/admin/courses')
      .then(({ data }) => setCourses(data ?? []))
      .catch(() => setCourses([]));
  }, []);

  const courseTitle = useMemo(
    () => new Map(courses.map((c) => [c.id, c.title] as const)),
    [courses],
  );

  async function remove(c: AdminCoupon) {
    if (!window.confirm(`Excluir o cupom ${c.code}? O código fica livre para reutilizar.`)) return;
    await api.DELETE('/v1/admin/coupons/{id}', { params: { path: { id: c.id } } });
    load();
  }

  async function toggle(c: AdminCoupon) {
    await api.PATCH('/v1/admin/coupons/{id}', {
      params: { path: { id: c.id } },
      body: { active: !c.active },
    });
    load();
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-green-800">Cupons</h1>
          <p className="mt-1 text-sm text-muted">
            Descontos aplicados no checkout. O desconto incide sobre o valor do meio escolhido (Pix
            já com os 5%, cartão e boleto sobre o plano) e o uso conta quando o pagamento é
            confirmado.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>Novo cupom</Button>
      </header>

      {coupons === null ? (
        <p className="text-muted">Carregando…</p>
      ) : coupons.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted">
          Nenhum cupom cadastrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Desconto</th>
                <th className="px-4 py-3">Vale para</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{c.code}</td>
                    <td className="px-4 py-3">{discountLabel(c)}</td>
                    <td className="max-w-[260px] px-4 py-3 text-muted">
                      {c.appliesToAllCourses
                        ? 'Todos os cursos'
                        : c.courseIds
                            .map((id) => courseTitle.get(id) ?? 'Curso removido')
                            .join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      {c.usedCount}
                      {c.maxUses !== null ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className={`px-4 py-3 ${expired ? 'text-error' : ''}`}>
                      {formatDate(c.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggle(c)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          c.active && !expired && !exhausted
                            ? 'bg-green-50 text-green-700'
                            : 'bg-paper text-muted'
                        }`}
                        title={c.active ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {!c.active
                          ? 'Inativo'
                          : expired
                            ? 'Expirado'
                            : exhausted
                              ? 'Esgotado'
                              : 'Ativo'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="font-semibold text-green-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(c)}
                        className="ml-3 font-semibold text-error hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <CouponModal
          coupon={editing === 'new' ? null : editing}
          courses={courses}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function CouponModal({
  coupon,
  courses,
  onClose,
  onSaved,
}: {
  coupon: AdminCoupon | null;
  courses: AdminCourse[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(coupon?.code ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(coupon?.discountType ?? 'percent');
  // Percentual inteiro, ou reais com vírgula no valor fixo.
  const [discount, setDiscount] = useState(
    coupon
      ? coupon.discountType === 'percent'
        ? String(coupon.discountValue)
        : (coupon.discountValue / 100).toFixed(2).replace('.', ',')
      : '',
  );
  const [allCourses, setAllCourses] = useState(coupon?.appliesToAllCourses ?? true);
  const [courseIds, setCourseIds] = useState<string[]>(coupon?.courseIds ?? []);
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ? String(coupon.maxUses) : '');
  const [expiresAt, setExpiresAt] = useState(toDateInput(coupon?.expiresAt ?? null));
  const [active, setActive] = useState(coupon?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCourse(id: string) {
    setCourseIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value =
      discountType === 'percent'
        ? Math.round(Number(discount.replace(',', '.')))
        : Math.round(parseReais(discount) * 100);
    if (!Number.isFinite(value) || value < 1) {
      setError('Informe o valor do desconto.');
      return;
    }
    if (discountType === 'percent' && value > 100) {
      setError('O percentual máximo é 100%.');
      return;
    }
    if (!allCourses && courseIds.length === 0) {
      setError('Escolha ao menos um curso ou marque "Todos os cursos".');
      return;
    }
    const uses = maxUses.trim() ? Math.round(Number(maxUses)) : null;
    if (uses !== null && (!Number.isFinite(uses) || uses < 1)) {
      setError('Limite de usos inválido.');
      return;
    }
    const body = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: value,
      appliesToAllCourses: allCourses,
      courseIds: allCourses ? [] : courseIds,
      maxUses: uses,
      expiresAt: expiresAt || null,
      active,
    };
    setBusy(true);
    try {
      const { error: err } = coupon
        ? await api.PATCH('/v1/admin/coupons/{id}', { params: { path: { id: coupon.id } }, body })
        : await api.POST('/v1/admin/coupons', { body });
      if (err) throw err;
      onSaved();
    } catch (err) {
      setError(apiMessage(err, 'Não foi possível salvar o cupom.'));
    } finally {
      setBusy(false);
    }
  }

  const select = 'rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-green-800">
            {coupon ? 'Editar cupom' : 'Novo cupom'}
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
            label="Código do cupom"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EX: BLACK30, MED20"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
              Tipo de desconto
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className={select}
              >
                <option value="percent">Porcentagem (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </label>
            <Field
              label={discountType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder={discountType === 'percent' ? '20' : '500,00'}
              required
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold text-ink">
              Válido para quais cursos?
            </legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" checked={allCourses} onChange={() => setAllCourses(true)} />
              Todos os cursos
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" checked={!allCourses} onChange={() => setAllCourses(false)} />
              Cursos específicos
              {!allCourses && courseIds.length ? (
                <span className="text-muted">({courseIds.length} selecionado(s))</span>
              ) : null}
            </label>
            {!allCourses ? (
              <div className="max-h-56 overflow-y-auto rounded-[10px] border-[1.5px] border-border p-2">
                {courses.length === 0 ? (
                  <p className="p-2 text-sm text-muted">Nenhum curso cadastrado.</p>
                ) : (
                  courses.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-paper"
                    >
                      <input
                        type="checkbox"
                        checked={courseIds.includes(c.id)}
                        onChange={() => toggleCourse(c.id)}
                      />
                      <span className="flex-1">{c.title}</span>
                      {c.status !== 'published' ? (
                        <span className="text-xs text-muted">rascunho</span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Limite de usos (vazio = ilimitado)"
              inputMode="numeric"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 50"
            />
            <Field
              label="Data de expiração (opcional)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Cupom ativo
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          <div className="mt-1 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar cupom'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
