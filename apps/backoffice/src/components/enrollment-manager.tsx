import { useEffect, useState } from 'react';
import { Badge, Button } from '@vethis/ui';
import { api, type AdminCourse, type AdminEnrollment } from '../api';

export const ENROLL_STATUS: Record<AdminEnrollment['status'], string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

/** Gerencia as matrículas de um usuário/aluno: lista, matricula e remove. */
export function EnrollmentManager({
  userId,
  userLabel,
  courses,
  onChange,
}: {
  userId: string;
  userLabel: string;
  courses: AdminCourse[];
  onChange: () => void;
}) {
  const [enrollments, setEnrollments] = useState<AdminEnrollment[] | null>(null);
  const [courseId, setCourseId] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh(data: AdminEnrollment[]) {
    setEnrollments(data);
    onChange();
  }

  useEffect(() => {
    api
      .GET('/v1/admin/users/{id}/enrollments', { params: { path: { id: userId } } })
      .then(({ data }) => setEnrollments(data ?? []))
      .catch(() => setEnrollments([]));
  }, [userId]);

  async function enroll() {
    if (!courseId) return;
    setBusy(true);
    try {
      const { data } = await api.POST('/v1/admin/users/{id}/enrollments', {
        params: { path: { id: userId } },
        body: { courseId },
      });
      if (data) refresh(data);
      setCourseId('');
    } finally {
      setBusy(false);
    }
  }

  async function remove(cid: string) {
    const { data } = await api.DELETE('/v1/admin/users/{id}/enrollments/{courseId}', {
      params: { path: { id: userId, courseId: cid } },
    });
    if (data) refresh(data);
  }

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.courseId));
  const available = courses.filter((c) => !enrolledIds.has(c.id));

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-green-800">
        Matrículas de <span className="text-ink">{userLabel}</span>
      </p>

      {enrollments === null ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-muted">Sem matrículas.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {enrollments.map((e) => (
            <li
              key={e.courseId}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm text-ink">{e.title}</span>
              <span className="flex items-center gap-2">
                <Badge variant={e.status === 'completed' ? 'new' : 'highlight'}>
                  {ENROLL_STATUS[e.status]}
                </Badge>
                <Button size="sm" variant="text" onClick={() => void remove(e.courseId)}>
                  Remover
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
        >
          <option value="">Selecione um curso…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => void enroll()} disabled={busy || !courseId}>
          {busy ? 'Matriculando…' : 'Matricular'}
        </Button>
      </div>
    </div>
  );
}
