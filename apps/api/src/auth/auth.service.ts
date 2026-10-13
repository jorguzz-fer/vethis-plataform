import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { User } from '../db/schema/identity';
import { PasswordService } from './password.service';
import { MailerService } from '../mail/mailer.service';
import { welcomeMail } from '../mail/templates';
import type { LoginDto, RegisterDto } from './dto';

/** Mensagem uniforme no login — não revela se o e-mail existe (sem enumeração). */
const INVALID_CREDENTIALS = 'Credenciais inválidas';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(MailerService) private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: 'aluno',
    });
    this.mailer.sendSafe(
      { email: user.email, name: user.name ?? undefined },
      welcomeMail({ name: user.name, alunoUrl: this.mailer.alunoUrl }),
    );
    return user;
  }

  async validateCredentials(dto: LoginDto): Promise<User> {
    const user = await this.users.findByEmail(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const ok = await this.passwords.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return user;
  }
}
