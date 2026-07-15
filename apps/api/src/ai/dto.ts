import { z } from 'zod';

/** Entrada para gerar um rascunho de curso a partir de material bruto. */
export const aiCourseDraftInputSchema = z.object({
  material: z.string().min(20, 'Cole ao menos algumas linhas do material do curso.').max(20000),
  title: z.string().max(200).optional(),
});
export type AiCourseDraftInputDto = z.infer<typeof aiCourseDraftInputSchema>;

const draftFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const draftLessonSchema = z.object({
  title: z.string(),
  durationMinutes: z.number().int(),
});

const draftModuleSchema = z.object({
  title: z.string(),
  lessons: z.array(draftLessonSchema),
});

/**
 * Rascunho estruturado devolvido pela IA. Não persiste nada — é só uma sugestão
 * para pré-preencher o editor; o admin revisa e salva pelos endpoints normais.
 */
export const aiCourseDraftSchema = z.object({
  subtitle: z.string(),
  description: z.string(),
  workloadHours: z.number().int(),
  learningObjectives: z.array(z.string()),
  faq: z.array(draftFaqItemSchema),
  modules: z.array(draftModuleSchema),
});
export type AiCourseDraftDto = z.infer<typeof aiCourseDraftSchema>;

/** Estado do recurso de IA (para o backoffice esconder/mostrar o botão). */
export const aiStatusSchema = z.object({ enabled: z.boolean() });
export type AiStatusDto = z.infer<typeof aiStatusSchema>;

/**
 * JSON Schema de saída (structured outputs). Precisa de `additionalProperties:false`
 * e `required` completo em cada objeto; sem restrições de tamanho (não suportadas).
 */
export const AI_COURSE_DRAFT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    subtitle: { type: 'string' },
    description: { type: 'string' },
    workloadHours: { type: 'integer' },
    learningObjectives: { type: 'array', items: { type: 'string' } },
    faq: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
      },
    },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          lessons: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                durationMinutes: { type: 'integer' },
              },
              required: ['title', 'durationMinutes'],
            },
          },
        },
        required: ['title', 'lessons'],
      },
    },
  },
  required: ['subtitle', 'description', 'workloadHours', 'learningObjectives', 'faq', 'modules'],
} as const;
