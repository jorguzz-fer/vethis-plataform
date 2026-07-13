import { pgEnum } from 'drizzle-orm/pg-core';

/** Papéis globais de acesso (RBAC). Ver ADR 0006. */
export const roleEnum = pgEnum('role', ['aluno', 'staff', 'admin']);

/** Papel do usuário dentro de uma organização (B2B). Ver ADR 0007. */
export const orgRoleEnum = pgEnum('org_role', ['owner', 'manager', 'member']);

/** Nível do curso. */
export const courseLevelEnum = pgEnum('course_level', ['iniciante', 'intermediario', 'avancado']);

/** Situação de publicação do curso. */
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published']);

/** Situação da matrícula do aluno em um curso. */
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'completed',
  'cancelled',
]);

/** Situação de uma solicitação da secretaria online. */
export const secretariaStatusEnum = pgEnum('secretaria_status', [
  'open',
  'in_progress',
  'resolved',
]);

/** Estágio do lead no funil de CRM. */
export const leadStageEnum = pgEnum('lead_stage', ['new', 'contacted', 'qualified', 'won', 'lost']);

/** Situação do pedido (checkout → pagamento → matrícula). Ver ADR 0004. */
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'cancelled', 'refunded']);

/** Meio de pagamento oferecido no checkout (Pix-first). */
export const paymentMethodEnum = pgEnum('payment_method', ['pix', 'card', 'boleto']);

/** Situação de uma cobrança no gateway (port PaymentGateway). */
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

/** Tipo do papel global, derivado do enum (fonte de verdade da API). */
export type Role = (typeof roleEnum.enumValues)[number];
export type OrgRole = (typeof orgRoleEnum.enumValues)[number];
export type CourseLevel = (typeof courseLevelEnum.enumValues)[number];
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];
export type EnrollmentStatus = (typeof enrollmentStatusEnum.enumValues)[number];
export type SecretariaStatus = (typeof secretariaStatusEnum.enumValues)[number];
export type LeadStage = (typeof leadStageEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
