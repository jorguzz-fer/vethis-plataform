import { createVethisClient, type components } from '@vethis/api-client';

export type AuthUser = components['schemas']['AuthUser'];
export type Kpis = components['schemas']['Kpis'];
export type AdminCourse = components['schemas']['AdminCourse'];
export type AdminCourseDetail = components['schemas']['AdminCourseDetail'];
export type Lead = components['schemas']['Lead'];
export type Student = components['schemas']['Student'];
export type AdminUser = components['schemas']['AdminUser'];
export type AdminEnrollment = components['schemas']['AdminEnrollment'];
export type Instructor = components['schemas']['Instructor'];
export type Specialty = components['schemas']['Specialty'];

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = createVethisClient({ baseUrl });
