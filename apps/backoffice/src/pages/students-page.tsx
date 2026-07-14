import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Button, Field } from '@vethis/ui';
import { api, type AdminCourse, type AdminUser } from '../api';
import { EnrollmentManager } from '../components/enrollment-manager';

/** Gestão de alunos: cria, edita, redefine senha, desativa e matricula em cursos. */
export function StudentsPage() {
  const [students, setStudents] = useState<AdminUser[] | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [creating, setCreating] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);

  function load() {
    api
      .GET('/v1/admin/users')
      .then(({ data }) => setStudents((data ?? []).filter((u) => u.role === 'aluno')))
      .catch(() => setStudents([]));
  }
  useEffect(load, []);
  useEffect(() => {
    api.GET('/v1/admin/courses').then(({ data }) => setCourses(data ?? []));
  }, []);

  async function editName(u: AdminUser) {
    const name = window.prompt('Nome do aluno:', u.name ?? '');
    if (name === null) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      alert('O nome precisa ter ao menos 2 caracteres.');
      return;
    }
    await api.PATCH('/v1/admin/users/{id}', {
      params: { path: { id: u.id } },
      body: { name: trimmed },
    });
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

  if (students === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-green-800">Alunos</h1>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Fechar' : '+ Novo aluno'}
        </Button>
      </div>

      {creating ? (
        <CreateStudent
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      ) : null}

      {students.length === 0 ? (
        <p className="text-muted">Nenhum aluno ainda.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Matrículas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td className="px-4 py-3 font-medium text-ink">{u.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
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
                        <Button size="sm" variant="text" onClick={() => void editName(u)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="text" onClick={() => void resetPassword(u)}>
                          Redefinir senha
                        </Button>
                        <Button size="sm" variant="text" onClick={() => void deactivate(u)}>
                          Desativar
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {manageId === u.id ? (
                    <tr>
                      <td colSpan={4} className="bg-green-50/40 px-4 py-4">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Cria um aluno (papel fixo `aluno`). */
function CreateStudent({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await api.POST('/v1/admin/users', {
        body: { email, name: name || null, role: 'aluno', password },
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
      <Field
        label="Senha inicial"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
        className="sm:col-span-2"
      />
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Criando…' : 'Criar aluno'}
        </Button>
      </div>
    </form>
  );
}
