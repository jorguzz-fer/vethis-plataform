import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Field } from '@vethis/ui';
import { api, type AdminCourse, type AdminUser } from '../api';
import { useAuth } from '../auth';
import { EnrollmentManager } from '../components/enrollment-manager';

type Role = AdminUser['role'];

const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  staff: 'Equipe',
  admin: 'Admin',
};
// Usuários = equipe interna. Alunos têm a própria página (papel `aluno` fica de fora).
const ROLES: Role[] = ['staff', 'admin'];

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [creating, setCreating] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);

  function load() {
    api
      .GET('/v1/admin/users')
      .then(({ data }) => setUsers((data ?? []).filter((u) => u.role !== 'aluno')))
      .catch(() => setUsers([]));
  }
  useEffect(load, []);
  useEffect(() => {
    api.GET('/v1/admin/courses').then(({ data }) => setCourses(data ?? []));
  }, []);

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
                <Fragment key={u.id}>
                  <tr>
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
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => setManageId((cur) => (cur === u.id ? null : u.id))}
                        >
                          Matrículas
                        </Button>
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
                  {manageId === u.id ? (
                    <tr>
                      <td colSpan={5} className="bg-green-50/40 px-4 py-4">
                        <EnrollmentManager
                          userId={u.id}
                          userLabel={u.name ?? u.email}
                          courses={courses}
                          onChange={load}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Mensagem específica a partir do status/corpo do erro da API. */
function createUserErrorMessage(err: unknown, status?: number): string {
  const body = err as { message?: string | string[] } | undefined;
  const detail = Array.isArray(body?.message) ? body?.message.join('; ') : body?.message;
  if (status === 409) return 'Este e-mail já está cadastrado.';
  if (status === 400)
    return detail
      ? `Dados inválidos: ${detail}`
      : 'Dados inválidos — confira o e-mail, o nome e uma senha de ao menos 8 caracteres.';
  if (status === 401 || status === 403)
    return 'Sessão expirada ou sem permissão — saia e entre novamente.';
  if (status && status >= 500) return `O servidor não conseguiu criar (HTTP ${status}).`;
  if (detail) return `Não foi possível criar: ${detail}`;
  return 'Não foi possível criar (sem resposta do servidor). Verifique a rede e se está logado.';
}

function CreateUser({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // E-mail já pertence a um aluno (que não aparece nesta lista) → oferece promoção.
  const [student, setStudent] = useState<AdminUser | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStudent(null);
    try {
      const { error: err, response } = await api.POST('/v1/admin/users', {
        body: { email, name: name || null, role, password },
      });
      if (err) {
        if (response?.status === 409) {
          const { data } = await api.GET('/v1/admin/users');
          const found = (data ?? []).find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
          );
          if (found?.role === 'aluno') {
            setStudent(found);
            setError(
              `Este e-mail já está cadastrado como aluno (${found.name ?? found.email}). ` +
                `Você pode promovê-lo a ${ROLE_LABEL[role]} — ele mantém a senha e as matrículas atuais.`,
            );
            return;
          }
        }
        setError(createUserErrorMessage(err, response?.status));
        return;
      }
      onCreated();
    } catch {
      setError(createUserErrorMessage(undefined, undefined));
    } finally {
      setBusy(false);
    }
  }

  async function promote() {
    if (!student) return;
    setBusy(true);
    const { response } = await api.PATCH('/v1/admin/users/{id}', {
      params: { path: { id: student.id } },
      body: { role },
    });
    setBusy(false);
    if (!response.ok) {
      setError(createUserErrorMessage(undefined, response.status));
      return;
    }
    onCreated();
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
      <div className="flex gap-2 sm:col-span-2">
        {student ? (
          <Button type="button" disabled={busy} onClick={() => void promote()}>
            {busy ? 'Promovendo…' : `Promover a ${ROLE_LABEL[role]}`}
          </Button>
        ) : (
          <Button type="submit" disabled={busy}>
            {busy ? 'Criando…' : 'Criar usuário'}
          </Button>
        )}
      </div>
    </form>
  );
}
