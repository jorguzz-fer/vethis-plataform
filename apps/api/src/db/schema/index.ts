/**
 * Schema Drizzle — fonte de verdade do banco (ADR 0002/0007).
 * M1a cobre identidade + auditoria; catálogo, comércio, secretaria e CRM
 * entram junto com seus módulos nos próximos chunks do M1.
 */
export * from './enums';
export * from './identity';
export * from './catalog';
export * from './enrollment';
export * from './audit';
