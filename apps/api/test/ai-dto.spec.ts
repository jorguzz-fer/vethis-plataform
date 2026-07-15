import { describe, expect, it } from 'vitest';
import {
  aiCourseDraftInputSchema,
  aiCourseDraftSchema,
  AI_COURSE_DRAFT_JSON_SCHEMA,
} from '../src/ai/dto';

describe('aiCourseDraftInputSchema', () => {
  it('rejeita material muito curto', () => {
    expect(aiCourseDraftInputSchema.safeParse({ material: 'curto' }).success).toBe(false);
  });

  it('aceita material válido com título opcional', () => {
    const r = aiCourseDraftInputSchema.safeParse({
      material: 'Curso de responsabilidade técnica veterinária com legislação e prática.',
      title: 'RT Veterinária',
    });
    expect(r.success).toBe(true);
  });
});

describe('aiCourseDraftSchema', () => {
  it('valida o shape do rascunho estruturado', () => {
    const draft = {
      subtitle: 'A RT na prática',
      description: 'Curso sobre responsabilidade técnica.',
      workloadHours: 48,
      learningObjectives: ['Interpretar a legislação', 'Aplicar boas práticas'],
      faq: [{ question: 'Tem certificado?', answer: 'Sim, ao concluir.' }],
      modules: [{ title: 'Fundamentos', lessons: [{ title: 'Legislação', durationMinutes: 15 }] }],
    };
    expect(aiCourseDraftSchema.safeParse(draft).success).toBe(true);
  });

  it('rejeita rascunho com campos faltando', () => {
    expect(aiCourseDraftSchema.safeParse({ subtitle: 'x' }).success).toBe(false);
  });
});

describe('AI_COURSE_DRAFT_JSON_SCHEMA', () => {
  it('é fechado (additionalProperties:false) e lista todos os required', () => {
    expect(AI_COURSE_DRAFT_JSON_SCHEMA.additionalProperties).toBe(false);
    expect(AI_COURSE_DRAFT_JSON_SCHEMA.required).toContain('modules');
    expect(AI_COURSE_DRAFT_JSON_SCHEMA.required).toContain('faq');
  });
});
