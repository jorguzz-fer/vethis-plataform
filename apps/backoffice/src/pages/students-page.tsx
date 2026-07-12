import { useEffect, useState } from 'react';
import { api, type Student } from '../api';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);

  useEffect(() => {
    api
      .GET('/v1/admin/students')
      .then(({ data }) => setStudents(data ?? []))
      .catch(() => setStudents([]));
  }, []);

  if (students === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-green-800">Alunos</h1>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-ink">{s.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.email}</td>
                  <td className="px-4 py-3">{s.enrollments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
