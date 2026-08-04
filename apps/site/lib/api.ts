import { createVethisClient, type components } from '@vethis/api-client';

export type CourseSummary = components['schemas']['CourseSummary'];
export type CourseDetail = components['schemas']['CourseDetail'];
export type Specialty = components['schemas']['Specialty'];

const baseUrl = process.env.API_URL ?? 'http://localhost:3333';
const api = createVethisClient({ baseUrl });

/**
 * Assets (capa, avatar) são servidos pelo PRÓPRIO site (pasta public/). Se a API
 * devolver a URL com host local (APP_URL não configurado corretamente), converte
 * para caminho relativo — o navegador resolve no domínio do site e a imagem
 * carrega mesmo com o APP_URL da API errado. URLs externas (CDN) ficam intactas.
 */
function siteAsset(url: string | null | undefined): string | null {
  if (!url) return url ?? null;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0') {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    // já é caminho relativo
  }
  return url;
}

function normalizeCourse<T extends CourseSummary>(c: T): T {
  return {
    ...c,
    coverUrl: siteAsset(c.coverUrl),
    instructor: c.instructor
      ? { ...c.instructor, avatarUrl: siteAsset(c.instructor.avatarUrl) }
      : c.instructor,
  };
}

/**
 * Helpers de leitura do catálogo. Degradam graciosamente (retornam vazio/nulo)
 * se a API estiver indisponível — o site continua renderizando (Blueprint §15).
 */
export async function getSpecialties(): Promise<Specialty[]> {
  try {
    const { data } = await api.GET('/v1/catalog/specialties');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCourses(query?: {
  specialty?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado';
}): Promise<CourseSummary[]> {
  try {
    const { data } = await api.GET('/v1/catalog/courses', { params: { query: query ?? {} } });
    return (data ?? []).map(normalizeCourse);
  } catch {
    return [];
  }
}

export async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    const { data } = await api.GET('/v1/catalog/courses/{slug}', {
      params: { path: { slug } },
    });
    return data ? normalizeCourse(data) : null;
  } catch {
    return null;
  }
}
