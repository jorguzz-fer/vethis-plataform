import { useEffect, useState } from 'react';
import { formatBRL } from '@vethis/shared';
import { Badge, Button } from '@vethis/ui';
import { api, type AdminCourse } from '../api';

export function CoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);

  function load() {
    api
      .GET('/v1/admin/courses')
      .then(({ data }) => setCourses(data ?? []))
      .catch(() => setCourses([]));
  }
  useEffect(load, []);

  async function toggle(course: AdminCourse) {
    const status = course.status === 'published' ? 'draft' : 'published';
    await api.PATCH('/v1/admin/courses/{id}', {
      params: { path: { id: course.id } },
      body: { status },
    });
    load();
  }

  if (courses === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-green-800">Cursos</h1>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Nível</th>
              <th className="px-4 py-3 font-semibold">Preço</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
                <td className="px-4 py-3 text-muted">{c.level}</td>
                <td className="px-4 py-3">{formatBRL(c.priceCents)}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === 'published' ? 'new' : 'level'}>
                    {c.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="soft" onClick={() => toggle(c)}>
                    {c.status === 'published' ? 'Despublicar' : 'Publicar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
