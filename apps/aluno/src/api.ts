import { createVethisClient, type components } from '@vethis/api-client';

export type AuthUser = components['schemas']['AuthUser'];
export type EnrolledCourse = components['schemas']['EnrolledCourse'];
export type CoursePlayer = components['schemas']['CoursePlayer'];
export type SecretariaRequest = components['schemas']['SecretariaRequest'];
export type CourseSummary = components['schemas']['CourseSummary'];

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

/** URL do site/ecommerce — destino do CTA "explorar cursos". */
export const siteUrl = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000';

/** Client tipado; envia o cookie de sessão httpOnly (credentials: include). */
export const api = createVethisClient({ baseUrl });
