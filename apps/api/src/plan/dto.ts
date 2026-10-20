import { z } from 'zod';

/** Chave de tarefa: minúsculas, dígitos e hífen (ex.: `f1-01`, `pauta-3`). */
export const planTaskKeySchema = z.string().regex(/^[a-z0-9-]{2,40}$/, 'Chave de tarefa inválida');

export const planTaskSchema = z.object({
  key: planTaskKeySchema,
  done: z.boolean(),
  doneAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});
export type PlanTaskDto = z.infer<typeof planTaskSchema>;

export const planTasksSchema = z.object({
  tasks: z.array(planTaskSchema),
});
export type PlanTasksDto = z.infer<typeof planTasksSchema>;

export const setPlanTaskSchema = z.object({
  done: z.boolean(),
});
export type SetPlanTaskDto = z.infer<typeof setPlanTaskSchema>;
