import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { Role } from '../src/db/schema/enums';
import { RolesGuard } from '../src/auth/guards/roles.guard';

function makeContext(userRole?: Role) {
  const req = userRole ? { user: { id: 'u1', email: 'a@b.com', role: userRole } } : {};
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as never;
}

function makeReflector(required: Role[] | undefined): Reflector {
  return { getAllAndOverride: () => required } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('libera rota sem @Roles', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeContext('aluno'))).toBe(true);
  });

  it('libera quando o papel do usuário está entre os exigidos', () => {
    const guard = new RolesGuard(makeReflector(['staff', 'admin']));
    expect(guard.canActivate(makeContext('admin'))).toBe(true);
  });

  it('bloqueia quando o papel não é suficiente', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    expect(() => guard.canActivate(makeContext('aluno'))).toThrow(ForbiddenException);
  });
});
