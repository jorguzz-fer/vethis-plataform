import { describe, expect, it } from 'vitest';
import { createCourseSchema, createLessonSchema, createUserSchema } from '../src/admin/dto';

describe('createCourseSchema', () => {
  it('aceita curso mínimo (só título) e aplica defaults', () => {
    const r = createCourseSchema.safeParse({ title: 'Novo Curso' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.priceCents).toBe(0);
      expect(r.data.level).toBe('iniciante');
      expect(r.data.status).toBe('draft');
    }
  });

  it('rejeita slug com maiúsculas/espaços', () => {
    expect(createCourseSchema.safeParse({ title: 'X', slug: 'Curso Invalido' }).success).toBe(
      false,
    );
  });
});

describe('createLessonSchema', () => {
  it('aceita aula com vimeo id e default de duração', () => {
    const r = createLessonSchema.safeParse({ title: 'Aula 1', vimeoVideoId: '123456' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.durationSeconds).toBe(0);
  });
});

describe('createUserSchema', () => {
  it('exige e-mail válido e senha >= 8', () => {
    expect(
      createUserSchema.safeParse({ email: 'a@b.com', role: 'staff', password: '12345678' }).success,
    ).toBe(true);
    expect(createUserSchema.safeParse({ email: 'x', role: 'staff', password: '1' }).success).toBe(
      false,
    );
  });

  it('papel padrão é aluno', () => {
    const r = createUserSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(r.success && r.data.role).toBe('aluno');
  });
});
