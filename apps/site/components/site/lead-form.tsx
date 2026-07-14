'use client';

import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { browserApi } from '@/lib/browser-api';
import { readAttribution } from '@/lib/attribution';

/**
 * Gatilho de captura de lead: um botão que abre um modal com o formulário.
 * Envia nome/e-mail/telefone + atribuição first-touch para `POST /v1/leads`.
 */
export function LeadFormTrigger({
  children,
  className,
  style,
  source,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  source: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? <LeadModal source={source} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function LeadModal({ source, onClose }: { source: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await browserApi.POST('/v1/leads', {
        body: {
          name,
          email,
          phone: phone || undefined,
          source,
          attribution: readAttribution(),
        },
      });
      if (err) throw new Error();
      setDone(true);
    } catch {
      setError('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(2,20,12,.55)',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 60px rgba(2,20,12,.35)',
          color: '#16201B',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 18 }}>Fale com a equipe Vethis</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: 0,
              fontSize: 24,
              lineHeight: 1,
              cursor: 'pointer',
              color: '#5C665F',
            }}
          >
            ×
          </button>
        </div>

        {done ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0 }}>Recebemos seu contato! 🎉</p>
            <p style={{ margin: '6px 0 0', color: '#5C665F', fontSize: 14 }}>
              Nossa equipe vai falar com você em breve.
            </p>
            <button
              type="button"
              className="btn btn-gold"
              style={{ marginTop: 16 }}
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <LeadField label="Nome" value={name} onChange={setName} required />
            <LeadField label="E-mail" type="email" value={email} onChange={setEmail} required />
            <LeadField label="Telefone (opcional)" value={phone} onChange={setPhone} />
            {error ? <p style={{ color: '#C0392B', fontSize: 14, margin: 0 }}>{error}</p> : null}
            <button type="submit" className="btn btn-gold" disabled={busy} style={{ marginTop: 4 }}>
              {busy ? 'Enviando…' : 'Enviar'}
            </button>
            <p style={{ margin: 0, color: '#5C665F', fontSize: 12 }}>
              Ao enviar você concorda com nossa Política de Privacidade.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function LeadField({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}
    >
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          border: '1.5px solid #E2E1D8',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 15,
          fontWeight: 400,
          outline: 'none',
        }}
      />
    </label>
  );
}
