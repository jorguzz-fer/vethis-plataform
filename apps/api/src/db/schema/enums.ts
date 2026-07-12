import { pgEnum } from 'drizzle-orm/pg-core';

/** Papéis globais de acesso (RBAC). Ver ADR 0006. */
export const roleEnum = pgEnum('role', ['aluno', 'staff', 'admin']);

/** Papel do usuário dentro de uma organização (B2B). Ver ADR 0007. */
export const orgRoleEnum = pgEnum('org_role', ['owner', 'manager', 'member']);
