import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthedRequest } from '../../common/auth-user';
import { UsersService } from '../../users/users.service';
import { SESSION_COOKIE, SessionService } from '../session.service';

/**
 * Exige sessão válida. Lê o id de sessão do cookie assinado, resolve o usuário
 * no banco (papel sempre fresco) e o anexa à request. Server-authoritative.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const sid = req.signedCookies?.[SESSION_COOKIE];
    if (!sid) {
      throw new UnauthorizedException('Não autenticado');
    }
    const userId = await this.sessions.getUserId(sid);
    if (!userId) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
