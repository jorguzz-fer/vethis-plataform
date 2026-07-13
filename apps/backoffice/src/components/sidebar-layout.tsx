import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

const nav = [
  { to: '/', label: 'Painel', end: true },
  { to: '/cursos', label: 'Cursos' },
  { to: '/usuarios', label: 'Usuários' },
  { to: '/alunos', label: 'Alunos' },
  { to: '/crm', label: 'CRM' },
];

/** Layout do backoffice: sidebar verde + conteúdo (VethisDesignSystem §8). */
export function SidebarLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-green-900 px-4 py-6 text-[#EAF0EC]">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-green-700 font-serif text-gold-400">
            V
          </span>
          <span className="font-serif text-lg font-semibold">Vethis</span>
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
