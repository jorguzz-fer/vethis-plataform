import { createVethisClient, type components } from '@vethis/api-client';

export type AuthUser = components['schemas']['AuthUser'];
export type EnrolledCourse = components['schemas']['EnrolledCourse'];
export type CoursePlayer = components['schemas']['CoursePlayer'];
export type SecretariaRequest = components['schemas']['SecretariaRequest'];

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

/** Client tipado; envia o cookie de sessão httpOnly (credentials: include). */
export const api = createVethisClient({ baseUrl });
