import type { ReactNode, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

type IconProps = SVGProps<SVGSVGElement>;

function HomeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function CoursesIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 1 4 16V5.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 0 20 16V5.5Z" />
    </svg>
  );
}

function SecretariaIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path d="M13.5 3.5V8h4.5" />
      <path d="M9 12.5h6M9 16h4" />
    </svg>
  );
}

function LogoutIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M15 4.5h2.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 12H3.5M6 8.5 3 12l3 3.5" />
    </svg>
  );
}

const navItems = [
  { to: '/inicio', label: 'Início', icon: HomeIcon },
  { to: '/meus-cursos', label: 'Meus cursos', icon: CoursesIcon },
  { to: '/secretaria', label: 'Secretaria', icon: SecretariaIcon },
];

/** Lockup oficial Vethis. `inverted` deixa branco (sobre fundo escuro). */
function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <img
      src="/vethis-logo.png"
      alt="Vethis — Educação Médica Veterinária"
      className={className}
      style={inverted ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}

/**
 * Casca do app: sidebar de navegação à esquerda no desktop (lg+) e barra de
 * navegação inferior no mobile. Container largo e confortável (DS §7).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <Logo className="mx-6 my-6 h-12 w-auto" />

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-muted hover:bg-green-50/60 hover:text-green-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold-500"
                    />
                  ) : null}
                  <Icon className="h-5 w-5" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-green-50/60 hover:text-green-700"
          >
            <LogoutIcon className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Header — mobile */}
      <header className="flex items-center justify-between bg-green-800 px-5 py-4 text-paper lg:hidden">
        <Logo inverted className="h-9 w-auto" />
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-medium text-[#C6D3CA] hover:text-paper"
        >
          Sair
        </button>
      </header>

      {/* Conteúdo */}
      <div className="flex-1">
        <main className="mx-auto w-full max-w-[1440px] px-5 py-6 pb-24 lg:px-10 lg:py-10 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-border bg-green-900 lg:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold ${
                isActive ? 'text-gold-500' : 'text-[#B9C7BE]'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
