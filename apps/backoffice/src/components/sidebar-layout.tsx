import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

const nav = [
  { to: '/', label: 'Painel', end: true },
  { to: '/cursos', label: 'Cursos' },
  { to: '/usuarios', label: 'Usuários' },
  { to: '/alunos', label: 'Alunos' },
  { to: '/crm', label: 'CRM' },
  { to: '/fluxo', label: 'Fluxo' },
];

/** Layout do backoffice: sidebar verde + conteúdo (VethisDesignSystem §8). */
export function SidebarLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-green-900 px-4 py-6 text-[#EAF0EC]">
        <div className="mb-8 px-2">
          {/* Lockup oficial invertido para branco sobre o fundo escuro do admin. */}
          <img
            src="/vethis-logo.png"
            alt="Vethis — Educação Médica Veterinária"
            className="block h-12 w-auto"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-green-800 text-gold-400' : 'text-[#B9C7BE] hover:bg-green-800/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-white/10 pt-4 text-xs text-[#8AA096]">
          <p className="truncate">{user?.email}</p>
          <button type="button" onClick={() => void logout()} className="mt-1 hover:text-paper">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
