/**
 * @vethis/shared — tipos, schemas (Zod) e utilitários compartilhados entre
 * backend, site, área do aluno e backoffice.
 *
 * Preenchido no M1 (contratos de domínio). Por ora, apenas primitivos comuns.
 */

/** Papéis de acesso (RBAC). Ver ADR 0006. */
export const ROLES = ['aluno', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Dinheiro em centavos (inteiro) — nunca float. Ver ADR 0007. */
export type Cents = number;

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
