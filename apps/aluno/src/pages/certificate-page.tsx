import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@vethis/ui';
import { api, type Certificate } from '../api';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CertificatePage() {
  const { slug = '' } = useParams();
  const [cert, setCert] = useState<Certificate | null | 'error'>(null);

  useEffect(() => {
    api
      .GET('/v1/me/courses/{slug}/certificate', { params: { path: { slug } } })
      .then(({ data, error }) => setCert(error || !data ? 'error' : data))
      .catch(() => setCert('error'));
  }, [slug]);

  if (cert === null) return <p className="text-muted">Carregando…</p>;

  if (cert === 'error') {
    return (
      <div className="max-w-lg">
        <h1 className="mb-2 font-serif text-2xl font-semibold text-green-800">
          Certificado indisponível
        </h1>
        <p className="text-muted">
          O certificado é liberado quando você conclui todas as aulas do curso.
        </p>
        <Link
          to={`/curso/${slug}`}
          className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline"
        >
          ← Voltar ao curso
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          to={`/curso/${slug}`}
          className="text-sm font-semibold text-green-700 hover:underline"
        >
          ← Voltar ao curso
        </Link>
        <Button variant="gold" onClick={() => window.print()}>
          Imprimir / salvar PDF
        </Button>
      </div>

      {/* Área imprimível (o print-area some o resto via @media print no index.css) */}
      <div className="print-area">
        <div className="mx-auto max-w-3xl rounded-2xl border-[6px] border-green-800 bg-white p-8 text-center shadow-[0_20px_60px_-30px_rgba(10,31,25,.5)] sm:p-12">
          <img src="/vethis-logo.png" alt="Vethis" className="mx-auto h-16 w-auto" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
            Certificado de Conclusão
          </p>
          <p className="mt-6 text-muted">Certificamos que</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-green-800 sm:text-4xl">
            {cert.studentName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink">
            concluiu com êxito o curso{' '}
            <strong className="text-green-800">{cert.courseTitle}</strong>, composto por{' '}
            {cert.lessonsTotal} aula(s) de educação médica veterinária continuada.
          </p>
          <p className="mt-2 text-sm text-muted">Concluído em {formatDate(cert.completedAt)}</p>

          <div className="mt-10 flex items-end justify-center gap-16">
            {cert.instructorName ? (
              <div className="text-center">
                <div className="mx-auto w-48 border-t border-ink/40" />
                <p className="mt-1 text-sm font-semibold text-ink">{cert.instructorName}</p>
                <p className="text-xs text-muted">Instrutor(a)</p>
              </div>
            ) : null}
            <div className="text-center">
              <div className="mx-auto w-48 border-t border-ink/40" />
              <p className="mt-1 text-sm font-semibold text-ink">Vethis</p>
              <p className="text-xs text-muted">Educação Médica Veterinária</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
