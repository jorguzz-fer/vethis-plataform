import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser, type AuthUser, type AuthedRequest } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema, type LoginDto, type RegisterDto } from './dto';
import { SESSION_COOKIE, SessionService } from './session.service';
import { SessionGuard } from './guards/session.guard';
import type { User } from '../db/schema/identity';

interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: User['role'];
}

function toPublicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  /** Cadastro + login automático. Limite de tentativas por IP. */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.auth.register(dto);
    const sid = await this.sessions.create(user.id);
    this.sessions.setCookie(res, sid);
    return toPublicUser(user);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.auth.validateCredentials(dto);
    const sid = await this.sessions.create(user.id);
    this.sessions.setCookie(res, sid);
    return toPublicUser(user);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sid = req.signedCookies?.[SESSION_COOKIE];
    if (sid) {
      await this.sessions.destroy(sid);
    }
    this.sessions.clearCookie(res);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
