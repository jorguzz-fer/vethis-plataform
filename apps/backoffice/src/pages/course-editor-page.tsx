import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Field } from '@vethis/ui';
import { api, type AdminCourseDetail, type Instructor, type Specialty } from '../api';

type Level = AdminCourseDetail['level'];
type Status = AdminCourseDetail['status'];
type FaqItem = AdminCourseDetail['faq'][number];

const LEVELS: { value: Level; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];

function realToCents(v: string): number {
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
function centsToReal(c: number): string {
  return (c / 100).toFixed(2).replace('.', ',');
}

/** Editor de curso: cria (sem id) ou edita (com id) metadados + módulos + aulas. */
export function CourseEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // Form de metadados (controlado; para novo curso começa vazio).
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '0,00',
    level: 'iniciante' as Level,
    status: 'draft' as Status,
    coverUrl: '',
    specialtyId: '',
    instructorId: '',
    workloadHours: '',
    learningObjectives: [] as string[],
    faq: [] as FaqItem[],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.GET('/v1/catalog/specialties').then(({ data }) => setSpecialties(data ?? []));
    api.GET('/v1/admin/instructors').then(({ data }) => setInstructors(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    api
      .GET('/v1/admin/courses/{id}', { params: { path: { id: id! } } })
      .then(({ data }) => {
        if (!data) return;
        setCourse(data);
        setForm({
          title: data.title,
          subtitle: data.subtitle ?? '',
          description: data.description ?? '',
          price: centsToReal(data.priceCents),
          level: data.level,
          status: data.status,
          coverUrl: data.coverUrl ?? '',
          specialtyId: data.specialtyId ?? '',
          instructorId: data.instructorId ?? '',
          workloadHours: data.workloadHours != null ? String(data.workloadHours) : '',
          learningObjectives: data.learningObjectives ?? [],
          faq: data.faq ?? [],
        });
      })
      .catch(() => setCourse(null));
  }, [id, isNew]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const workload = form.workloadHours.trim();
    const body = {
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      priceCents: realToCents(form.price),
      level: form.level,
      status: form.status,
      coverUrl: form.coverUrl || null,
      specialtyId: form.specialtyId || null,
      instructorId: form.instructorId || null,
      workloadHours: workload ? Math.max(0, Math.round(Number(workload) || 0)) : null,
      learningObjectives: form.learningObjectives.map((s) => s.trim()).filter(Boolean),
      faq: form.faq
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question && f.answer),
    };
    try {
      if (isNew) {
        const { data, error } = await api.POST('/v1/admin/courses', { body });
        if (error || !data) throw new Error();
        navigate(`/cursos/${data.id}`);
        return;
      }
      const res = await api.PATCH('/v1/admin/courses/{id}', {
        params: { path: { id: id! } },
        body,
      });
      if (res.error) throw new Error();
      setMsg('Alterações salvas.');
      const refreshed = await api.GET('/v1/admin/courses/{id}', { params: { path: { id: id! } } });
      if (refreshed.data) setCourse(refreshed.data);
    } catch {
      setMsg('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function addInstructor() {
    const name = window.prompt('Nome do instrutor:');
    if (!name?.trim()) return;
    const { data } = await api.POST('/v1/admin/instructors', { body: { name: name.trim() } });
    if (data) {
      setInstructors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      set('instructorId', data.id);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/cursos" className="text-sm font-semibold text-green-700 hover:underline">
        ← Voltar aos cursos
      </Link>
      <h1 className="mb-6 mt-2 font-serif text-3xl font-semibold text-green-800">
        {isNew ? 'Novo curso' : 'Editar curso'}
      </h1>

      <form
        onSubmit={saveMeta}
        className="flex flex-col gap-4 rounded-lg border border-border bg-white p-6"
      >
        <Field
          label="Título"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
        <Field
          label="Subtítulo"
          value={form.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Descrição
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <Field
            label="Preço (R$)"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
          <Field
            label="Carga horária (h)"
            inputMode="numeric"
            value={form.workloadHours}
            onChange={(e) => set('workloadHours', e.target.value)}
            placeholder="ex.: 40"
          />
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Nível
            <select
              value={form.level}
              onChange={(e) => set('level', e.target.value as Level)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Especialidade
            <select
              value={form.specialtyId}
              onChange={(e) => set('specialtyId', e.target.value)}
              className="rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
            >
              <option value="">—</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Instrutor
            <div className="flex gap-2">
              <select
                value={form.instructorId}
                onChange={(e) => set('instructorId', e.target.value)}
                className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px]"
              >
                <option value="">—</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" variant="soft" onClick={() => void addInstructor()}>
                Novo
              </Button>
            </div>
          </label>
        </div>

        {form.instructorId ? (
          <InstructorBioEditor
            instructor={instructors.find((i) => i.id === form.instructorId)}
            onSaved={(updated) =>
              setInstructors((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
            }
          />
        ) : null}

        <Field
          label="Capa (URL da imagem)"
          value={form.coverUrl}
          onChange={(e) => set('coverUrl', e.target.value)}
          placeholder="https://…"
        />

        <ObjectivesEditor
          items={form.learningObjectives}
          onChange={(v) => set('learningObjectives', v)}
        />

        <FaqEditor items={form.faq} onChange={(v) => set('faq', v)} />

        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={form.status === 'published'}
            onChange={(e) => set('status', e.target.checked ? 'published' : 'draft')}
          />
          Publicado (visível no site)
        </label>

        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : isNew ? 'Criar curso' : 'Salvar alterações'}
          </Button>
          {isNew ? (
            <span className="text-sm text-muted">Os módulos e aulas aparecem após criar.</span>
          ) : null}
        </div>
      </form>

      {!isNew && course ? <ModulesEditor course={course} onChange={setCourse} /> : null}
    </div>
  );
}

/* --------------------- Objetivos de aprendizagem ------------------------- */

function ObjectivesEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">O que o aluno vai aprender</span>
      <p className="-mt-1 text-xs text-muted">
        Vira a seção “O que você vai aprender” na página do curso. Deixe vazio para ocultar.
      </p>
      {items.map((obj, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={obj}
            onChange={(e) => onChange(items.map((o, i) => (i === idx ? e.target.value : o)))}
            placeholder={`Objetivo ${idx + 1}`}
            className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="text"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
          >
            Remover
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" size="sm" variant="soft" onClick={() => onChange([...items, ''])}>
          + Objetivo
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- FAQ ----------------------------------- */

function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-ink">Perguntas frequentes</span>
      <p className="-mt-2 text-xs text-muted">
        Se vazio, a página usa a lista padrão da Vethis. Preencha para personalizar por curso.
      </p>
      {items.map((f, idx) => (
        <div key={idx} className="flex flex-col gap-2 rounded-lg border border-border bg-paper p-3">
          <div className="flex items-center gap-2">
            <input
              value={f.question}
              onChange={(e) =>
                onChange(
                  items.map((it, i) => (i === idx ? { ...it, question: e.target.value } : it)),
                )
              }
              placeholder="Pergunta"
              className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm font-medium"
            />
            <Button
              type="button"
              size="sm"
              variant="text"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              Remover
            </Button>
          </div>
          <textarea
            value={f.answer}
            onChange={(e) =>
              onChange(items.map((it, i) => (i === idx ? { ...it, answer: e.target.value } : it)))
            }
            placeholder="Resposta"
            rows={2}
            className="rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
          />
        </div>
      ))}
      <div>
        <Button
          type="button"
          size="sm"
          variant="soft"
          onClick={() => onChange([...items, { question: '', answer: '' }])}
        >
          + Pergunta
        </Button>
      </div>
    </div>
  );
}

/* ----------------------- Bio da coordenação (instrutor) ------------------ */

function InstructorBioEditor({
  instructor,
  onSaved,
}: {
  instructor: Instructor | undefined;
  onSaved: (updated: Instructor) => void;
}) {
  const [bio, setBio] = useState(instructor?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setBio(instructor?.bio ?? '');
    setMsg(null);
  }, [instructor?.id, instructor?.bio]);

  if (!instructor) return null;

  async function save() {
    if (!instructor) return;
    setSaving(true);
    setMsg(null);
    const { data, error } = await api.PATCH('/v1/admin/instructors/{id}', {
      params: { path: { id: instructor.id } },
      body: { bio: bio.trim() || null },
    });
    setSaving(false);
    if (error || !data) {
      setMsg('Não foi possível salvar a bio.');
      return;
    }
    onSaved(data);
    setMsg('Bio salva.');
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-paper p-3">
      <span className="text-sm font-semibold text-ink">Bio de {instructor.name}</span>
      <p className="-mt-1 text-xs text-muted">
        Aparece na seção “Conheça a coordenação”. Salva no instrutor (vale para todos os cursos
        dele).
      </p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        placeholder="Formação, atuação clínica e docente…"
        className="rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar bio'}
        </Button>
        {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      </div>
    </div>
  );
}

/* ----------------------------- Módulos e aulas --------------------------- */

function ModulesEditor({
  course,
  onChange,
}: {
  course: AdminCourseDetail;
  onChange: (c: AdminCourseDetail) => void;
}) {
  const [moduleTitle, setModuleTitle] = useState('');

  async function addModule(e: FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    const { data } = await api.POST('/v1/admin/courses/{id}/modules', {
      params: { path: { id: course.id } },
      body: { title: moduleTitle.trim() },
    });
    if (data) onChange(data);
    setModuleTitle('');
  }

  async function renameModule(moduleId: string, current: string) {
    const title = window.prompt('Título do módulo:', current);
    if (!title?.trim()) return;
    const { data } = await api.PATCH('/v1/admin/modules/{id}', {
      params: { path: { id: moduleId } },
      body: { title: title.trim() },
    });
    if (data) onChange(data);
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('Excluir este módulo e suas aulas?')) return;
    const { data } = await api.DELETE('/v1/admin/modules/{id}', {
      params: { path: { id: moduleId } },
    });
    if (data) onChange(data);
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-serif text-2xl font-semibold text-green-800">Conteúdo</h2>

      <div className="flex flex-col gap-4">
        {course.modules.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h3 className="font-serif text-base font-semibold text-green-800">{m.title}</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="text" onClick={() => void renameModule(m.id, m.title)}>
                  Renomear
                </Button>
                <Button size="sm" variant="text" onClick={() => void deleteModule(m.id)}>
                  Excluir
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {m.lessons.map((l) => (
                <LessonRow key={l.id} lesson={l} onChange={onChange} />
              ))}
              {m.lessons.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">Sem aulas ainda.</li>
              ) : null}
            </ul>
            <AddLesson moduleId={m.id} onChange={onChange} />
          </div>
        ))}
      </div>

      <form onSubmit={addModule} className="mt-4 flex gap-2">
        <input
          value={moduleTitle}
          onChange={(e) => setModuleTitle(e.target.value)}
          placeholder="Novo módulo…"
          className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-border px-3.5 py-2.5 text-[15px]"
        />
        <Button type="submit" variant="soft">
          + Módulo
        </Button>
      </form>
    </section>
  );
}

type Lesson = AdminCourseDetail['modules'][number]['lessons'][number];

function LessonRow({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (c: AdminCourseDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [minutes, setMinutes] = useState(String(Math.round(lesson.durationSeconds / 60)));
  const [vimeo, setVimeo] = useState(lesson.vimeoVideoId ?? '');
  const [free, setFree] = useState(lesson.isFree);

  async function save() {
    const { data } = await api.PATCH('/v1/admin/lessons/{id}', {
      params: { path: { id: lesson.id } },
      body: {
        title,
        durationSeconds: (Number(minutes) || 0) * 60,
        vimeoVideoId: vimeo || null,
        isFree: free,
      },
    });
    if (data) onChange(data);
    setEditing(false);
  }

  async function remove() {
    if (!confirm('Excluir esta aula?')) return;
    const { data } = await api.DELETE('/v1/admin/lessons/{id}', {
      params: { path: { id: lesson.id } },
    });
    if (data) onChange(data);
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 bg-green-50/40 px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
          placeholder="Título da aula"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            inputMode="numeric"
            className="w-24 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
            placeholder="min"
          />
          <input
            value={vimeo}
            onChange={(e) => setVimeo(e.target.value)}
            className="w-40 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
            placeholder="Vimeo ID"
          />
          <label className="flex items-center gap-1.5 text-sm text-ink">
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />{' '}
            Prévia
          </label>
          <div className="ml-auto flex gap-1">
            <Button size="sm" onClick={() => void save()}>
              Salvar
            </Button>
            <Button size="sm" variant="text" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{lesson.title}</span>
        <span className="text-xs text-muted">
          {Math.max(1, Math.round(lesson.durationSeconds / 60))} min
          {lesson.vimeoVideoId ? ` · Vimeo ${lesson.vimeoVideoId}` : ' · sem vídeo'}
          {lesson.isFree ? ' · prévia' : ''}
        </span>
      </span>
      <Button size="sm" variant="text" onClick={() => setEditing(true)}>
        Editar
      </Button>
      <Button size="sm" variant="text" onClick={() => void remove()}>
        Excluir
      </Button>
    </li>
  );
}

function AddLesson({
  moduleId,
  onChange,
}: {
  moduleId: string;
  onChange: (c: AdminCourseDetail) => void;
}) {
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [vimeo, setVimeo] = useState('');

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await api.POST('/v1/admin/modules/{id}/lessons', {
      params: { path: { id: moduleId } },
      body: {
        title: title.trim(),
        durationSeconds: (Number(minutes) || 0) * 60,
        vimeoVideoId: vimeo || null,
        isFree: false,
      },
    });
    if (data) onChange(data);
    setTitle('');
    setMinutes('');
    setVimeo('');
  }

  return (
    <form onSubmit={add} className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova aula…"
        className="min-w-0 flex-1 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
      />
      <input
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        inputMode="numeric"
        placeholder="min"
        className="w-20 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
      />
      <input
        value={vimeo}
        onChange={(e) => setVimeo(e.target.value)}
        placeholder="Vimeo ID"
        className="w-32 rounded-[8px] border-[1.5px] border-border px-3 py-2 text-sm"
      />
      <Button type="submit" size="sm" variant="soft">
        + Aula
      </Button>
    </form>
  );
}
