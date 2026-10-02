import type { MetadataRoute } from 'next';
import { getCourses } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

/** Gerado dinamicamente a partir do catálogo publicado. */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getCourses();
  const now = new Date();
  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/cursos'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...courses.map((c) => ({
      url: absoluteUrl(`/cursos/${c.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
