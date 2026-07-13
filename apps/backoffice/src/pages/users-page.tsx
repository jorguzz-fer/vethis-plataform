import { useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Field } from '@vethis/ui';
import { api, type AdminUser } from '../api';
import { useAuth } from '../auth';

type Role = AdminUser['role'];

const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  staff: 'Equipe',
  admin: 'Admin',
};
const ROLES: Role[] = ['aluno', 'staff', 'admin'];

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api
      .GET('/v1/admin/users')
      .then(({ data }) => setUsers(data ?? []))
      .catch(() => setUsers([]));
  }
  useEffect(load, []);

  async function changeRole(u: AdminUser, role: Role) {
    if (role === u.role) return;
    await api.PATCH('/v1/admin/users/{id}', { params: { path: { id: u.id } }, body: { role } });
    load();
  }

  async function resetPassword(u: AdminUser) {
    const newPassword = window.prompt(`Nova senha para ${u.email} (mín. 8 caracteres):`);
    if (!newPassword) return;
    const { error } = await api.POST('/v1/admin/users/{id}/password', {
      params: { path: { id: u.id } },
      body: { newPassword },
    });
    alert(error ? 'Falha ao redefinir (mín. 8 caracteres).' : 'Senha redefinida.');
  }

  async function deactivate(u: AdminUser) {
    if (!confirm(`Desativar ${u.email}? A conta perde o acesso.`)) return;
    await api.DELETE('/v1/admin/users/{id}', { params: { path: { id: u.id } } });
    load();
  }

  if (users === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-green-800">Usuários</h1>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Fechar' : '+ Novo usuário'}
        </Button>
      </div>

      {creating ? (
        <CreateUser
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Papel</th>
              <th className="px-4 py-3 font-semibold">Matrículas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {u.name ?? '—'}
                    {isSelf ? <Badge variant="highlight">você</Badge> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="font-medium text-ink">{ROLE_LABEL[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => void changeRole(u, e.target.value as Role)}
                        className="rounded-[8px] border-[1.5px] border-border px-2 py-1.5 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.enrollments}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="text" onClick={() => void resetPassword(u)}>
                        Redefinir senha
                      </Button>
                      {!isSelf ? (
                        <Button size="sm" variant="text" onClick={() => void deactivate(u)}>
                          Desativar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUser({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('aluno');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await api.POST('/v1/admin/users', {
        body: { email, name: name || null, role, password },
      });
      if (err) throw new Error();
      onCreated();
    } catch {
      setError('Não foi possível criar. O e-mail já pode estar em uso.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-5 sm:grid-cols-2"
    >
      <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <Field
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Papel
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Senha inicial"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Criando…' : 'Criar usuário'}
        </Button>
      </div>
    </form>
  );
}
