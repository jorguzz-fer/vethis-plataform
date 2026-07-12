import { createVethisClient, type components } from '@vethis/api-client';

export type CourseSummary = components['schemas']['CourseSummary'];
export type CourseDetail = components['schemas']['CourseDetail'];
export type Specialty = components['schemas']['Specialty'];

const baseUrl = process.env.API_URL ?? 'http://localhost:3333';
const api = createVethisClient({ baseUrl });

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
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    const { data } = await api.GET('/v1/catalog/courses/{slug}', {
      params: { path: { slug } },
    });
    return data ?? null;
  } catch {
    return null;
  }
}
