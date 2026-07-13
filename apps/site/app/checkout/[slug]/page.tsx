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
      <CheckoutClient course={course} />
    </div>
  );
}
