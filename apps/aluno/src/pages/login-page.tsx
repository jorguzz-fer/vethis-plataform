import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, PasswordField } from '@vethis/ui';
import { useAuth } from '../auth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate('/inicio');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <main className="flex flex-col justify-center bg-paper px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <img src="/vethis-logo.png" alt="Vethis" className="mb-8 h-12 w-auto lg:hidden" />
          <h1 className="font-serif text-3xl font-semibold text-ink">Bem-vindo de volta</h1>
          <p className="mt-2 text-muted">Acesse sua área do aluno para continuar seus estudos.</p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <Field
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordField
              label="Senha"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button type="submit" disabled={busy} className="mt-1">
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-sm text-muted">
            <LockIcon />
            <span>Conexão segura — seus dados são criptografados.</span>
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            Ao entrar você concorda com a{' '}
            <a
              href="https://vethis.com.br/privacidade"
              className="font-medium text-green-700 underline underline-offset-2 hover:text-green-800"
            >
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-green-900 p-12 text-white lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-700/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative">
        <img
          src="/vethis-logo.png"
          alt="Vethis"
          className="h-12 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Educação médica veterinária continuada
        </span>
        <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight">
          Toda a sua formação veterinária em uma tela só.
        </h2>
        <p className="mt-4 text-white/70">
          Cursos, aulas e sua secretaria acadêmica reunidos em um único lugar — no ritmo da sua
          rotina clínica.
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        <FeatureCard
          icon={<PlayIcon />}
          title="Aulas com progresso salvo"
          desc="Retome de onde parou, em qualquer dispositivo."
        />
        <FeatureCard
          icon={<CertificateIcon />}
          title="Certificação reconhecida"
          desc="Emita seu certificado ao concluir cada curso."
        />
        <FeatureCard
          icon={<DeskIcon />}
          title="Secretaria online"
          desc="Documentos e solicitações sem sair de casa."
        />
      </div>
    </aside>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-sm text-white/60">{desc}</p>
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

function PlayIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 8 21l4-2 4 2-1-7.5" />
    </svg>
  );
}

function DeskIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 5h16M5 5v14M19 5v14M4 19h16M9 9h6M9 13h6" />
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
