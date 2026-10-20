import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { planTasks, type PlanTask } from '../db/schema/plan-tasks';
import type { PlanTaskDto, PlanTasksDto } from './dto';

function toDto(row: PlanTask): PlanTaskDto {
  return {
    key: row.key,
    done: row.done,
    doneAt: row.doneAt ? row.doneAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Estado compartilhado das tarefas do plano de marketing (sem autenticação). */
@Injectable()
export class PlanService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listTasks(): Promise<PlanTasksDto> {
    const rows = await this.db.select().from(planTasks).orderBy(asc(planTasks.key));
    return { tasks: rows.map(toDto) };
  }

  /** Upsert: marca ou desmarca a tarefa. O último clique vence. */
  async setTask(key: string, done: boolean): Promise<PlanTaskDto> {
    const now = new Date();
    const values = { key, done, doneAt: done ? now : null, updatedAt: now };
    const [row] = await this.db
      .insert(planTasks)
      .values(values)
      .onConflictDoUpdate({
        target: planTasks.key,
        set: { done: values.done, doneAt: values.doneAt, updatedAt: values.updatedAt },
      })
      .returning();
    return toDto(row!);
  }
}
