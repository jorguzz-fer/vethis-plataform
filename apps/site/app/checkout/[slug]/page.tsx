import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/api';
import { CheckoutClient } from '@/components/checkout/checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-[1040px] px-6 pt-8">
        <Link
          href={`/cursos/${course.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
        >
          <span aria-hidden>←</span> Voltar ao curso
        </Link>
      </div>
      {course.comingSoon ? (
        <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[2px] text-gold-600">Em breve</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-green-800">
            Matrículas ainda não abertas
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            As inscrições para <strong className="text-ink">{course.title}</strong> abrem em breve.
            Volte à página do curso para deixar seu contato e ser avisado.
          </p>
          <Link
            href={`/cursos/${course.slug}`}
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
          >
            Ver o curso
          </Link>
        </div>
      ) : (
        <CheckoutClient course={course} />
      )}
    </div>
  );
}
