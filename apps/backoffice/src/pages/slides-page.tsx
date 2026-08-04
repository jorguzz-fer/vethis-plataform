import { useEffect, useState, type ChangeEvent } from 'react';
import { Button, buttonClasses } from '@vethis/ui';
import { api, type AdminHeroSlide, type HeroHotspot } from '../api';

/** Envia um arquivo para a API e devolve a URL pública. */
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
  const res = await fetch(`${base}/v1/admin/uploads`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function SlidesPage() {
  const [slides, setSlides] = useState<AdminHeroSlide[] | null>(null);

  function load() {
    api
      .GET('/v1/admin/hero-slides')
      .then(({ data }) => setSlides(data ?? []))
      .catch(() => setSlides([]));
  }
  useEffect(load, []);

  if (slides === null) return <p className="text-muted">Carregando…</p>;

  const nextOrder = slides.reduce((m, s) => Math.max(m, s.sortOrder), -1) + 1;

  return (
    <div className="max-w-3xl">
      <header className="mb-2">
        <h1 className="font-serif text-3xl font-semibold text-green-800">Slides do Hero</h1>
        <p className="mt-1 text-sm text-muted">
          Slides do carrossel da home, na ordem de exibição. O mock do app entra sempre como último
          slide. Enquanto nenhum slide for cadastrado aqui, o site mostra os 2 slides padrão.
        </p>
      </header>

      <NewSlide nextOrder={nextOrder} onCreated={load} />

      {slides.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted">
          Nenhum slide cadastrado — o site está usando os slides padrão.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((s) => (
            <SlideCard key={s.id} slide={s} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Formulário compacto para criar um slide (exige uma imagem). */
function NewSlide({ nextOrder, onCreated }: { nextOrder: number; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setImageUrl(await uploadImage(file));
    } catch {
      setError('Falha ao enviar. Use PNG, JPG ou WEBP (até 5MB) e confirme que está logado.');
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!imageUrl || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await api.POST('/v1/admin/hero-slides', {
        body: { title: title.trim(), imageUrl, sortOrder: nextOrder },
      });
      if (err) throw new Error('fail');
      setTitle('');
      setImageUrl('');
      onCreated();
    } catch {
      setError('Não foi possível criar o slide.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">Novo slide</h2>
      <div className="flex flex-col gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Prévia do slide"
            className="w-full max-w-md rounded-lg border border-border"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-black/5">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => void onFile(e)}
            />
            {busy ? 'Enviando…' : imageUrl ? 'Trocar imagem' : 'Enviar imagem'}
          </label>
          <input
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Nome interno (ex.: Clínica Médica de Felinos)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!imageUrl || !title.trim() || busy}
            onClick={() => void create()}
          >
            Adicionar slide
          </Button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

const EMPTY_HOTSPOT: HeroHotspot = {
  label: '',
  href: '',
  left: '10%',
  top: '75%',
  width: '12%',
  height: '7%',
};

/** Card editável de um slide: imagem, textos, ordem, hotspots e ações. */
function SlideCard({ slide, onChange }: { slide: AdminHeroSlide; onChange: () => void }) {
  const [title, setTitle] = useState(slide.title);
  const [alt, setAlt] = useState(slide.alt);
  const [imageUrl, setImageUrl] = useState(slide.imageUrl);
  const [sortOrder, setSortOrder] = useState(slide.sortOrder);
  const [active, setActive] = useState(slide.active);
  const [hotspots, setHotspots] = useState<HeroHotspot[]>(slide.hotspots);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setHotspot(i: number, patch: Partial<HeroHotspot>) {
    setHotspots((hs) => hs.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setImageUrl(await uploadImage(file));
    } catch {
      setError('Falha ao enviar a imagem.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    // Só envia hotspots completos (a API exige todos os campos preenchidos).
    const clean = hotspots.filter(
      (h) => h.label.trim() && h.href.trim() && h.left && h.top && h.width && h.height,
    );
    try {
      const { error: err } = await api.PATCH('/v1/admin/hero-slides/{id}', {
        params: { path: { id: slide.id } },
        body: { title: title.trim(), alt, imageUrl, sortOrder, active, hotspots: clean },
      });
      if (err) throw new Error('fail');
      onChange();
    } catch {
      setError('Não foi possível salvar. Confira os campos.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Excluir o slide "${slide.title}"?`)) return;
    setBusy(true);
    try {
      await api.DELETE('/v1/admin/hero-slides/{id}', { params: { path: { id: slide.id } } });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-64 sm:shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Prévia" className="w-full rounded-lg border border-border" />
          ) : (
            <div className="aspect-[21/9] w-full rounded-lg border border-dashed border-border" />
          )}
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-black/5">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => void onFile(e)}
            />
            {busy ? 'Enviando…' : 'Trocar imagem'}
          </label>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Nome interno</span>
              <input
                className="w-full rounded-lg border border-border px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Ordem</span>
              <input
                type="number"
                className="w-full rounded-lg border border-border px-3 py-2"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Texto alternativo (acessibilidade/SEO)
            </span>
            <input
              className="w-full rounded-lg border border-border px-3 py-2"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>

          <label className="mt-3 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo (aparece no site)
          </label>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Botões clicáveis</span>
              <button
                type="button"
                className="text-xs font-medium text-green-700 underline"
                onClick={() => setHotspots((hs) => [...hs, { ...EMPTY_HOTSPOT }])}
              >
                + Adicionar botão
              </button>
            </div>
            <p className="mb-2 text-xs text-muted">
              Posição e tamanho em % da imagem (ex.: 15%). O botão fica invisível, sobre o botão
              desenhado no slide.
            </p>
            <div className="flex flex-col gap-3">
              {hotspots.map((h, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-border px-2 py-1.5 text-sm"
                      placeholder="Rótulo (ex.: Garantir minha vaga)"
                      value={h.label}
                      onChange={(e) => setHotspot(i, { label: e.target.value })}
                    />
                    <input
                      className="rounded-lg border border-border px-2 py-1.5 text-sm"
                      placeholder="Link (ex.: /cursos/pos-clinica-medica-felinos)"
                      value={h.href}
                      onChange={(e) => setHotspot(i, { href: e.target.value })}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(['left', 'top', 'width', 'height'] as const).map((k) => (
                      <label key={k} className="text-xs text-muted">
                        {k}
                        <input
                          className="mt-0.5 w-full rounded-lg border border-border px-2 py-1 text-sm text-ink"
                          value={h[k]}
                          onChange={(e) => setHotspot(i, { [k]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs text-red-600 underline"
                    onClick={() => setHotspots((hs) => hs.filter((_, idx) => idx !== i))}
                  >
                    Remover botão
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              Salvar
            </Button>
            <button
              type="button"
              className={`${buttonClasses('outline', 'sm')} text-red-600`}
              disabled={busy}
              onClick={() => void remove()}
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
