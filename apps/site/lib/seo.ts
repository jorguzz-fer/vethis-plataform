/**
 * Helpers de SEO/GEO do site: URL canônica, imagem Open Graph padrão e
 * construtores de dados estruturados (JSON-LD, schema.org). Usado pelas páginas
 * para metadata (generateMetadata) e pelos blocos <JsonLd>.
 */
import type { CourseDetail, CourseSummary } from '@/lib/api';

/** Domínio público do site (sem barra final). Configurável por env. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vethis.com.br').replace(
  /\/+$/,
  '',
);
export const SITE_NAME = 'Vethis';
export const SITE_DESCRIPTION =
  'Formação médica veterinária continuada, baseada em casos reais. Pós-graduações e cursos por especialidade, 100% online.';
/** Imagem padrão para compartilhamento (Open Graph/Twitter). */
export const DEFAULT_OG_IMAGE = '/cursos/hero-2-mec-doctum.png';

/** Converte um caminho relativo em URL absoluta; mantém URLs já absolutas. */
export function absoluteUrl(path?: string | null): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Texto limpo para description (sem quebras, com limite de caracteres). */
export function metaDescription(text: string | null | undefined, max = 160): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type Json = Record<string, unknown>;

/** schema.org/Organization — identidade da marca (home). */
export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/vethis-logo.png'),
    description: SITE_DESCRIPTION,
  };
}

/** schema.org/WebSite — o site em si (home). */
export function websiteLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}

/** schema.org/Course — curso individual (página do curso). */
export function courseLd(course: CourseDetail): Json {
  const url = absoluteUrl(`/cursos/${course.slug}`);
  const node: Json = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: metaDescription(course.description ?? course.subtitle, 320),
    url,
    inLanguage: 'pt-BR',
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  if (course.coverUrl) node.image = absoluteUrl(course.coverUrl);
  if (course.subtitle) node.alternateName = course.subtitle;
  if (course.learningObjectives?.length) node.teaches = course.learningObjectives;

  const instance: Json = { '@type': 'CourseInstance', courseMode: 'online' };
  if (course.workloadHours) instance.courseWorkload = `PT${course.workloadHours}H`;
  node.hasCourseInstance = instance;

  if (!course.comingSoon && course.priceCents > 0) {
    node.offers = {
      '@type': 'Offer',
      category: 'Paid',
      price: (course.priceCents / 100).toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/checkout/${course.slug}`),
    };
  }
  return node;
}

/** schema.org/BreadcrumbList — trilha de navegação. */
export function breadcrumbLd(items: Array<{ name: string; path: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** schema.org/FAQPage — perguntas frequentes (ótimo para GEO/IA). */
export function faqPageLd(faq: Array<{ question: string; answer: string }>): Json | null {
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** schema.org/ItemList — lista de cursos (catálogo). */
export function courseListLd(courses: CourseSummary[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/cursos/${c.slug}`),
      name: c.title,
    })),
  };
}
