import { pgEnum } from 'drizzle-orm/pg-core';

/** Papéis globais de acesso (RBAC). Ver ADR 0006. */
export const roleEnum = pgEnum('role', ['aluno', 'staff', 'admin']);

/** Papel do usuário dentro de uma organização (B2B). Ver ADR 0007. */
export const orgRoleEnum = pgEnum('org_role', ['owner', 'manager', 'member']);

/** Nível do curso. */
export const courseLevelEnum = pgEnum('course_level', ['iniciante', 'intermediario', 'avancado']);

/** Situação de publicação do curso. */
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published']);

/** Tipo do papel global, derivado do enum (fonte de verdade da API). */
export type Role = (typeof roleEnum.enumValues)[number];
export type OrgRole = (typeof orgRoleEnum.enumValues)[number];
export type CourseLevel = (typeof courseLevelEnum.enumValues)[number];
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];
