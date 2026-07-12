import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '../db/schema/enums';

/** Usuário autenticado anexado à request pelo SessionGuard. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthedRequest {
  user?: AuthUser;
  signedCookies?: Record<string, string>;
}

/** Extrai o usuário autenticado: `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user;
  },
);
