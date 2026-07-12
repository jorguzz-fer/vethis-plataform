import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { User } from '../db/schema/identity';
import { PasswordService } from './password.service';
import type { LoginDto, RegisterDto } from './dto';

/** Mensagem uniforme no login — não revela se o e-mail existe (sem enumeração). */
const INVALID_CREDENTIALS = 'Credenciais inválidas';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const passwordHash = await this.passwords.hash(dto.password);
    return this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: 'aluno',
    });
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
