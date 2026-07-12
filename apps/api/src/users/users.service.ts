import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { users, type NewUser, type User } from '../db/schema/identity';

/** Acesso a usuários. Ignora registros com soft-delete (deletedAt não nulo). */
@Injectable()
export class UsersService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    return rows[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return rows[0];
  }

  async create(input: NewUser): Promise<User> {
    const rows = await this.db
      .insert(users)
      .values({ ...input, email: input.email.toLowerCase() })
      .returning();
    return rows[0]!;
  }
}
