import { createVethisClient, type components } from '@vethis/api-client';

export type AuthUser = components['schemas']['AuthUser'];
export type Kpis = components['schemas']['Kpis'];
export type AdminCourse = components['schemas']['AdminCourse'];
export type Lead = components['schemas']['Lead'];
export type Student = components['schemas']['Student'];

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = createVethisClient({ baseUrl });
