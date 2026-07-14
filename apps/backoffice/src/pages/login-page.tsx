import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Button } from '@vethis/ui';
import { useAuth } from '../auth';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-green-900 px-6 py-12 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-700/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-sm">
        <img
          src="/vethis-logo.png"
          alt="Vethis"
          className="mb-6 h-14 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Backoffice
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold">Bem-vindo de volta</h1>
        <p className="mt-2 text-white/60">Acesse o painel administrativo da Vethis.</p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <DarkField
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@vethis.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <DarkPasswordField
            label="Senha"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={busy} className="mt-1">
            {busy ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
          <LockIcon />
          <span>Conexão segura — acesso restrito à equipe.</span>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-[10px] border-[1.5px] border-white/15 bg-white/5 px-3.5 py-3 text-[15px] text-white ' +
  'placeholder-white/40 outline-none transition-colors focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20';

interface DarkFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

function DarkField({ label, id, ...props }: DarkFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-white/80">
        {label}
      </label>
      <input id={inputId} className={inputClass} {...props} />
    </div>
  );
}

function DarkPasswordField({ label, id, ...props }: Omit<DarkFieldProps, 'type'>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-white/80">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`${inputClass} pr-11`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/50 transition-colors hover:text-white"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function iconProps(size = 20) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps(16)}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
