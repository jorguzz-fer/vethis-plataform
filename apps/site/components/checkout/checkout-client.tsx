'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { formatBRL } from '@vethis/shared';
import { Badge, Button, Field } from '@vethis/ui';
import type { CourseDetail } from '@/lib/api';
import { readAttribution } from '@/lib/attribution';
import {
  alunoUrl,
  browserApi,
  type AuthUser,
  type OrderDto,
  type PaymentMethod,
} from '@/lib/browser-api';

/** Desconto do Pix à vista — espelha a regra server-authoritative da API. */
const PIX_DISCOUNT_PERCENT = 5;
/** Teto de parcelas oferecidas (cartão e boleto/carnê). */
const MAX_INSTALLMENTS = 24;

/** Valor cobrado para o meio escolhido (Pix à vista tem desconto). */
function netPriceCents(method: PaymentMethod, priceCents: number): number {
  if (method === 'pix') {
    return Math.round((priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);
  }
  return priceCents;
}

/** Opções de parcelamento (sem juros) até o teto, dinheiro em centavos. */
function installmentOptions(priceCents: number): { n: number; label: string }[] {
  return Array.from({ length: MAX_INSTALLMENTS }, (_, i) => {
    const n = i + 1;
    return { n, label: `${n}x de ${formatBRL(Math.round(priceCents / n))}` };
  });
}

/** Seletor de parcelas (sem juros), usado por cartão e boleto/carnê. */
function InstallmentsField({
  priceCents,
  value,
  onChange,
}: {
  priceCents: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
      Parcelas (sem juros)
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
      >
        {installmentOptions(priceCents).map((o) => (
          <option key={o.n} value={o.n}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckoutClient({ course }: { course: CourseDetail }) {
  const [me, setMe] = useState<AuthUser | null | undefined>(undefined);
  const [order, setOrder] = useState<OrderDto | null>(null);
  // Meio/parcelas ficam aqui em cima para o resumo espelhar preço e parcela.
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);

  // Descobre a sessão atual (login-antes-de-pagar).
  useEffect(() => {
    browserApi
      .GET('/v1/auth/me')
      .then(({ data }) => setMe(data ?? null))
      .catch(() => setMe(null));
  }, []);

  // Polling do pedido enquanto o pagamento (Pix/boleto) está pendente.
  const refreshOrder = useCallback(async (id: string) => {
    const { data } = await browserApi.GET('/v1/orders/{id}', { params: { path: { id } } });
    if (data) setOrder(data);
  }, []);

  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const t = setInterval(() => void refreshOrder(order.id), 3000);
    return () => clearInterval(t);
  }, [order, refreshOrder]);

  const paid = order?.status === 'paid';

  return (
    <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-14">
      <div className="min-w-0">
        {paid ? (
          <SuccessPanel course={course} />
        ) : order ? (
          <PaymentPendingPanel
            order={order}
            onSimulate={() => void refreshOrder(order.id)}
            setOrder={setOrder}
          />
        ) : me === undefined ? (
          <p className="text-muted">Carregando…</p>
        ) : me ? (
          <PaymentPanel
            course={course}
            defaultName=""
            onOrder={setOrder}
            method={method}
            setMethod={setMethod}
            installments={installments}
            setInstallments={setInstallments}
          />
        ) : (
          <AuthPanel onAuthed={setMe} />
        )}
      </div>

      <OrderSummary course={course} order={order} method={method} installments={installments} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Passo 1 — autenticação (criar conta ou entrar)                      */
/* ------------------------------------------------------------------ */

function AuthPanel({ onAuthed }: { onAuthed: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        const { error: err } = await browserApi.POST('/v1/auth/register', {
          body: { email, password, name: name || undefined },
        });
        if (err) throw new Error('Não foi possível criar a conta. O e-mail já pode estar em uso.');
      } else {
        const { error: err } = await browserApi.POST('/v1/auth/login', {
          body: { email, password },
        });
        if (err) throw new Error('E-mail ou senha incorretos.');
      }
      const { data } = await browserApi.GET('/v1/auth/me');
      if (data) onAuthed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
        Passo 1 de 2
      </span>
      <h1 className="mt-1 font-serif text-2xl font-semibold text-green-800">
        {mode === 'register' ? 'Crie sua conta para continuar' : 'Entre na sua conta'}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Sua matrícula fica vinculada a esta conta e libera o curso na área do aluno.
      </p>

      <div className="mt-5 inline-flex rounded-[10px] border border-border p-1">
        {(['register', 'login'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === m ? 'bg-green-700 text-white' : 'text-muted hover:text-green-700'
            }`}
          >
            {m === 'register' ? 'Criar conta' : 'Entrar'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        {mode === 'register' ? (
          <Field
            label="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        ) : null}
        <Field
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Field
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" disabled={busy} className="mt-1 w-full">
          {busy ? 'Aguarde…' : 'Continuar para o pagamento'}
        </Button>
      </form>

      {mode === 'register' ? (
        <p className="mt-4 rounded-lg bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700">
          Enviamos um e-mail de confirmação. Se não estiver na caixa de entrada, verifique o{' '}
          <strong>spam / lixo eletrônico</strong> e marque como “não é spam” para receber os
          próximos avisos.
        </p>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Passo 2 — pagamento (Pix-first, cartão, boleto)                     */
/* ------------------------------------------------------------------ */

const METHODS: { key: PaymentMethod; label: string; hint: string }[] = [
  { key: 'pix', label: 'Pix', hint: `${PIX_DISCOUNT_PERCENT}% de desconto` },
  { key: 'card', label: 'Cartão', hint: 'Até 24x' },
  { key: 'boleto', label: 'Boleto', hint: 'Em até 24x' },
];

function PaymentPanel({
  course,
  defaultName,
  onOrder,
  method,
  setMethod,
  installments,
  setInstallments,
}: {
  course: CourseDetail;
  defaultName: string;
  onOrder: (o: OrderDto) => void;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  installments: number;
  setInstallments: (n: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados do comprador (nome + CPF sempre; endereço/telefone só no cartão).
  const [fullName, setFullName] = useState(defaultName);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');

  // Campos de cartão (só usados quando method === 'card').
  const [number, setNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');

  async function pay(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const card =
        method === 'card'
          ? {
              number: number.replace(/\s+/g, ''),
              holderName,
              expMonth: Number(exp.split('/')[0]),
              expYear: normalizeYear(exp.split('/')[1]),
              cvv,
            }
          : undefined;
      const customer = {
        name: fullName.trim(),
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        phone: phone.trim() || undefined,
        postalCode: postalCode.replace(/\D/g, '') || undefined,
        addressNumber: addressNumber.trim() || undefined,
      };
      const { data, error: err } = await browserApi.POST('/v1/checkout', {
        body: {
          courseSlug: course.slug,
          method,
          customer,
          card,
          installments: method === 'pix' ? 1 : installments,
          attribution: readAttribution(),
        },
      });
      if (err || !data)
        throw new Error(
          'Não foi possível iniciar o pagamento. Confira seus dados e tente novamente.',
        );
      onOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no pagamento.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
        Passo 2 de 2
      </span>
      <h1 className="mt-1 font-serif text-2xl font-semibold text-green-800">Pagamento</h1>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
        <Field
          label="CPF ou CNPJ"
          inputMode="numeric"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
          placeholder="000.000.000-00"
          required
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              method === m.key
                ? 'border-green-700 bg-green-50'
                : 'border-border hover:border-green-700/40'
            }`}
          >
            <span className="block text-sm font-bold text-ink">{m.label}</span>
            <span className="block text-[11px] text-muted">{m.hint}</span>
          </button>
        ))}
      </div>

      <form onSubmit={pay} className="mt-5 flex flex-col gap-4">
        {method === 'card' ? (
          <>
            <Field
              label="Número do cartão"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="0000 0000 0000 0000"
              required
            />
            <Field
              label="Nome impresso no cartão"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Validade (MM/AA)"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="12/30"
                required
              />
              <Field
                label="CVV"
                inputMode="numeric"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                required
              />
            </div>
            <InstallmentsField
              priceCents={course.priceCents}
              value={installments}
              onChange={setInstallments}
            />
            <p className="text-xs text-muted">
              Dados de cobrança exigidos pela operadora do cartão:
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field
                label="Telefone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 90000-0000"
                autoComplete="tel"
                required
              />
              <Field
                label="CEP"
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="00000-000"
                autoComplete="postal-code"
                required
              />
              <Field
                label="Nº"
                inputMode="numeric"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                placeholder="123"
                required
              />
            </div>
          </>
        ) : method === 'boleto' ? (
          <>
            <InstallmentsField
              priceCents={course.priceCents}
              value={installments}
              onChange={setInstallments}
            />
            <p className="rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              {installments > 1
                ? `Ao confirmar, geramos um carnê de ${installments}x. A matrícula é liberada após a compensação da 1ª parcela (1–2 dias úteis).`
                : 'Ao confirmar, geramos um boleto. A matrícula é liberada após a compensação (1–2 dias úteis).'}
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-paper px-4 py-3 text-sm text-muted">
            Ao confirmar, geramos um código Pix para pagamento imediato, já com{' '}
            {PIX_DISCOUNT_PERCENT}% de desconto — a matrícula é liberada assim que o pagamento cair.
          </p>
        )}

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" variant="gold" disabled={busy} className="mt-1 w-full">
          {busy
            ? 'Processando…'
            : method === 'pix'
              ? `Gerar Pix e pagar ${formatBRL(netPriceCents('pix', course.priceCents))}`
              : method === 'boleto'
                ? installments > 1
                  ? `Gerar carnê de ${installments}x`
                  : 'Gerar boleto'
                : `Pagar ${formatBRL(course.priceCents)}`}
        </Button>
        <p className="text-center text-xs text-muted">
          🔒 Pagamento seguro · Garantia de 7 dias · Dados do cartão não são armazenados
        </p>
      </form>
    </section>
  );
}

function normalizeYear(yy: string | undefined): number {
  const n = Number(yy ?? '');
  if (!Number.isFinite(n)) return 0;
  return n < 100 ? 2000 + n : n;
}

/* ------------------------------------------------------------------ */
/* Pagamento pendente — Pix copia-e-cola / boleto + polling            */
/* ------------------------------------------------------------------ */

function PaymentPendingPanel({
  order,
  onSimulate,
  setOrder,
}: {
  order: OrderDto;
  onSimulate: () => void;
  setOrder: (o: OrderDto) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  async function simulate() {
    setSimulating(true);
    try {
      const { data } = await browserApi.POST('/v1/orders/{id}/simulate-payment', {
        params: { path: { id: order.id } },
      });
      if (data) setOrder(data);
      else onSimulate();
    } finally {
      setSimulating(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-serif text-2xl font-semibold text-green-800">
        {order.method === 'pix' ? 'Pague com Pix para liberar o curso' : 'Boleto gerado'}
      </h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold-500" />
        Aguardando confirmação do pagamento…
      </p>

      {order.method === 'pix' && order.pixCopyPaste ? (
        <div className="mt-5">
          <div className="grid place-items-center rounded-xl border border-border bg-paper p-6">
            {order.pixQrCode ? (
              <img
                src={`data:image/png;base64,${order.pixQrCode}`}
                alt="QR Code Pix"
                className="h-48 w-48 rounded-lg bg-white p-2 shadow-inner"
              />
            ) : (
              <div className="grid h-40 w-40 place-items-center rounded-lg bg-white text-center text-xs text-muted shadow-inner">
                Escaneie o QR no app
                <br />
                ou copie o código abaixo
              </div>
            )}
          </div>
          <label className="mt-4 block text-sm font-semibold text-ink">Pix copia-e-cola</label>
          <div className="mt-1.5 flex gap-2">
            <input
              readOnly
              value={order.pixCopyPaste}
              className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-xs text-muted"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void navigator.clipboard?.writeText(order.pixCopyPaste ?? '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      ) : null}

      {order.method === 'boleto' && order.boletoUrl ? (
        <a
          href={order.boletoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-green-700 hover:underline"
        >
          Abrir boleto →
        </a>
      ) : null}

      {order.simulatable ? (
        <div className="mt-6 rounded-xl border border-dashed border-gold-500/60 bg-gold-50/50 p-4">
          <p className="text-xs text-muted">
            Ambiente de demonstração (gateway fake). Em produção, o Asaas confirma automaticamente
            via webhook.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void simulate()}
            disabled={simulating}
            className="mt-2"
          >
            {simulating ? 'Confirmando…' : 'Simular pagamento confirmado'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sucesso — matrícula liberada                                        */
/* ------------------------------------------------------------------ */

function SuccessPanel({ course }: { course: CourseDetail }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-700 text-white">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-8 w-8"
        >
          <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-5 font-serif text-2xl font-semibold text-green-800">
        Matrícula liberada! 🎉
      </h1>
      <p className="mt-2 text-muted">
        Você agora tem acesso a <strong className="text-ink">{course.title}</strong>. Bons estudos!
      </p>
      <a href={`${alunoUrl}/curso/${course.slug}`} className="mt-6 inline-block">
        <Button variant="gold" className="px-8">
          Acessar meu curso
        </Button>
      </a>
      <p className="mt-3 text-sm">
        <Link href="/cursos" className="text-green-700 hover:underline">
          Ver mais cursos
        </Link>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Resumo do pedido (coluna direita)                                   */
/* ------------------------------------------------------------------ */

function OrderSummary({
  course,
  order,
  method,
  installments,
}: {
  course: CourseDetail;
  order: OrderDto | null;
  method: PaymentMethod;
  installments: number;
}) {
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  // Antes do pedido, espelha a regra do método escolhido; depois, usa o pedido.
  const total = order?.amountCents ?? netPriceCents(method, course.priceCents);
  const parcels = order?.installments ?? (method === 'pix' ? 1 : installments);
  const pixDiscount = method === 'pix' && !order ? course.priceCents - total : 0;
  return (
    <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-6">
      <div
        className="mb-4 aspect-[16/9] rounded-xl bg-cover bg-center"
        style={{
          backgroundImage: course.coverUrl
            ? `url(${course.coverUrl})`
            : 'linear-gradient(150deg,#12603f,#0a2b20)',
        }}
      />
      {course.specialty ? <Badge variant="highlight">{course.specialty.name}</Badge> : null}
      <h2 className="mt-2 font-serif text-lg font-semibold text-green-800">{course.title}</h2>
      {course.instructor ? (
        <p className="text-sm text-muted">Com {course.instructor.name}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted">
        {course.modules.length} módulo(s) · {totalLessons} aula(s) · acesso vitalício
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="text-ink">{formatBRL(course.priceCents)}</span>
        </div>
        {pixDiscount > 0 ? (
          <div className="mt-2 flex items-center justify-between text-green-700">
            <span>Desconto Pix ({PIX_DISCOUNT_PERCENT}%)</span>
            <span>−{formatBRL(pixDiscount)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-serif text-xl font-semibold text-green-800">
            {formatBRL(total)}
          </span>
        </div>
        {parcels > 1 ? (
          <p className="mt-1 text-right text-xs text-muted">
            em {parcels}x de {formatBRL(Math.round(total / parcels))}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
