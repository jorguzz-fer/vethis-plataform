import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Hashing de senha com Argon2id (Blueprint §6). Parâmetros conservadores;
 * ajustar conforme benchmark do host de produção.
 */
@Injectable()
export class PasswordService {
  private readonly options = {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return hash(plain, this.options);
  }

  verify(hashed: string, plain: string): Promise<boolean> {
    return verify(hashed, plain).catch(() => false);
  }
}
