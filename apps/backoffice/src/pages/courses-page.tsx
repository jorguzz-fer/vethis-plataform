import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatBRL } from '@vethis/shared';
import { Badge, Button, buttonClasses } from '@vethis/ui';
import { api, type AdminCourse } from '../api';

export function CoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function remove(course: AdminCourse) {
    if (!confirm(`Excluir o curso "${course.title}"?`)) return;
    await api.DELETE('/v1/admin/courses/{id}', { params: { path: { id: course.id } } });
    load();
  }

  /** Move um curso para cima/baixo e persiste a nova ordem do catálogo. */
  async function move(index: number, dir: -1 | 1) {
    if (!courses || saving) return;
    const target = index + dir;
    if (target < 0 || target >= courses.length) return;
    const next = courses.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    setCourses(next); // otimista
    setSaving(true);
    try {
      const { data, error } = await api.POST('/v1/admin/courses/reorder', {
        body: { ids: next.map((c) => c.id) },
      });
      if (error) throw new Error('fail');
      if (data) setCourses(data);
    } catch {
      load(); // reverte para o que está no servidor
    } finally {
      setSaving(false);
    }
  }

  if (courses === null) return <p className="text-muted">Carregando…</p>;

  const arrowClass =
    'grid h-5 w-6 place-items-center rounded border border-border text-[11px] leading-none ' +
    'text-ink hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-green-800">Cursos</h1>
        <Link to="/cursos/novo" className={buttonClasses('primary', 'sm')}>
          + Novo curso
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Use as setas na coluna <strong>Ordem</strong> para definir a ordem de exibição na home e no
        catálogo (o primeiro da lista aparece primeiro).
      </p>

      {courses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-muted">
          Nenhum curso ainda. Clique em “Novo curso” para começar.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Ordem</th>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Nível</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((c, i) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className={arrowClass}
                        aria-label={`Subir ${c.title}`}
                        disabled={saving || i === 0}
                        onClick={() => void move(i, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className={arrowClass}
                        aria-label={`Descer ${c.title}`}
                        disabled={saving || i === courses.length - 1}
                        onClick={() => void move(i, 1)}
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    <Link to={`/cursos/${c.id}`} className="hover:text-green-700 hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.level}</td>
                  <td className="px-4 py-3">{formatBRL(c.priceCents)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'published' ? 'new' : 'level'}>
                      {c.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/cursos/${c.id}`} className={buttonClasses('soft', 'sm')}>
                        Editar
                      </Link>
                      <Button size="sm" variant="soft" onClick={() => toggle(c)}>
                        {c.status === 'published' ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button size="sm" variant="text" onClick={() => remove(c)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
