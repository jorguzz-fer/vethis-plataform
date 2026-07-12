import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

const navItems = [
  { to: '/meus-cursos', label: 'Cursos' },
  { to: '/secretaria', label: 'Secretaria' },
];

/** Casca do app: header verde + barra de navegação inferior (DS §7). */
export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="flex items-center justify-between bg-green-800 px-5 py-4 text-paper">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-green-700 font-serif text-gold-400"
          >
            V
          </span>
          <span className="font-serif text-lg font-semibold">Vethis</span>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-medium text-[#C6D3CA] hover:text-paper"
        >
          Sair
        </button>
      </header>

      <main className="flex-1 px-5 py-6 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-2xl border-t border-border bg-green-900">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm font-semibold ${
                isActive ? 'text-gold-500' : 'text-[#B9C7BE]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
