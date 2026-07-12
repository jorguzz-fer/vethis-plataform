import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../db/schema/enums';
import type { AuthedRequest } from '../../common/auth-user';
import { ROLES_KEY } from '../../common/roles.decorator';

/**
 * RBAC (menor privilégio). Deve rodar DEPOIS do SessionGuard, que popula
 * req.user. Rotas sem @Roles passam direto.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user || !required.includes(req.user.role)) {
      throw new ForbiddenException('Acesso negado');
    }
    return true;
  }
}
