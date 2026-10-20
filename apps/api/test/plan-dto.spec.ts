import { describe, expect, it } from 'vitest';
import { planTaskKeySchema, planTaskSchema, setPlanTaskSchema } from '../src/plan/dto';

describe('plan dto', () => {
  it('aceita chaves de tarefa da página', () => {
    for (const key of ['f1-01', 'f6-07', 'pauta-3', 'semana-rafa']) {
      expect(planTaskKeySchema.safeParse(key).success).toBe(true);
    }
  });

  it('rejeita chaves fora do padrão', () => {
    for (const key of ['', 'a', 'F1-01', 'f1 01', 'f1/01', 'x'.repeat(41), '../etc']) {
      expect(planTaskKeySchema.safeParse(key).success).toBe(false);
    }
  });

  it('exige um booleano em done', () => {
    expect(setPlanTaskSchema.safeParse({ done: true }).success).toBe(true);
    expect(setPlanTaskSchema.safeParse({ done: 'sim' }).success).toBe(false);
    expect(setPlanTaskSchema.safeParse({}).success).toBe(false);
  });

  it('serializa a tarefa com datas ISO', () => {
    const parsed = planTaskSchema.safeParse({
      key: 'f1-01',
      done: true,
      doneAt: '2026-10-21T12:00:00.000Z',
      updatedAt: '2026-10-21T12:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    expect(planTaskSchema.safeParse({ key: 'f1-01', done: false, doneAt: null }).success).toBe(
      false,
    );
  });
});
