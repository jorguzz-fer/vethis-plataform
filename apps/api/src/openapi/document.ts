import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authUserSchema, loginSchema, publicUserSchema, registerSchema } from '../auth/dto';
import {
  courseDetailSchema,
  courseSummarySchema,
  listCoursesQuerySchema,
  specialtySchema,
} from '../catalog/dto';
import {
  coursePlayerSchema,
  createSecretariaSchema,
  enrolledCourseSchema,
  secretariaRequestSchema,
} from '../me/dto';
import { createLeadSchema, leadSchema } from '../crm/dto';
import { adminCourseSchema, kpisSchema, studentSchema } from '../admin/dto';

extendZodWithOpenApi(z);

/**
 * Documento OpenAPI 3.1 — contrato como fonte de verdade (ADR 0002). Gerado a
 * partir dos MESMOS schemas Zod usados na validação, evitando drift. Alimenta a
 * geração do @vethis/api-client (M1d).
 */
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  const RegisterInput = registry.register('RegisterInput', registerSchema);
  const LoginInput = registry.register('LoginInput', loginSchema);
  const PublicUser = registry.register('PublicUser', publicUserSchema);
  const AuthUser = registry.register('AuthUser', authUserSchema);
  const Specialty = registry.register('Specialty', specialtySchema);
  const CourseSummary = registry.register('CourseSummary', courseSummarySchema);
  const CourseDetail = registry.register('CourseDetail', courseDetailSchema);
  const EnrolledCourse = registry.register('EnrolledCourse', enrolledCourseSchema);
  const CoursePlayer = registry.register('CoursePlayer', coursePlayerSchema);
  const SecretariaRequest = registry.register('SecretariaRequest', secretariaRequestSchema);
  const CreateSecretariaInput = registry.register('CreateSecretariaInput', createSecretariaSchema);
  const CreateLeadInput = registry.register('CreateLeadInput', createLeadSchema);
  const Lead = registry.register('Lead', leadSchema);
  const Kpis = registry.register('Kpis', kpisSchema);
  const AdminCourse = registry.register('AdminCourse', adminCourseSchema);
  const Student = registry.register('Student', studentSchema);

  const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });

  registry.registerPath({
    method: 'post',
    path: '/v1/auth/register',
    tags: ['auth'],
    summary: 'Cadastro de aluno (cria sessão)',
    request: { body: json(RegisterInput) },
    responses: { 201: { description: 'Criado', ...json(PublicUser) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/auth/login',
    tags: ['auth'],
    summary: 'Login (cria sessão)',
    request: { body: json(LoginInput) },
    responses: {
      200: { description: 'Autenticado', ...json(PublicUser) },
      401: { description: 'Credenciais inválidas' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/auth/logout',
    tags: ['auth'],
    summary: 'Encerra a sessão',
    responses: { 204: { description: 'Sem conteúdo' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/auth/me',
    tags: ['auth'],
    summary: 'Usuário autenticado',
    responses: {
      200: { description: 'OK', ...json(AuthUser) },
      401: { description: 'Não autenticado' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/catalog/specialties',
    tags: ['catalog'],
    summary: 'Lista especialidades',
    responses: { 200: { description: 'OK', ...json(z.array(Specialty)) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/catalog/courses',
    tags: ['catalog'],
    summary: 'Lista cursos publicados',
    request: { query: listCoursesQuerySchema },
    responses: { 200: { description: 'OK', ...json(z.array(CourseSummary)) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/catalog/courses/{slug}',
    tags: ['catalog'],
    summary: 'Detalhe do curso',
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: { description: 'OK', ...json(CourseDetail) },
      404: { description: 'Não encontrado' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/me/courses',
    tags: ['aluno'],
    summary: 'Cursos matriculados do aluno',
    responses: {
      200: { description: 'OK', ...json(z.array(EnrolledCourse)) },
      401: { description: 'Não autenticado' },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/me/courses/{slug}',
    tags: ['aluno'],
    summary: 'Player do curso (aulas com vídeo; exige matrícula)',
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: { description: 'OK', ...json(CoursePlayer) },
      403: { description: 'Não matriculado' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/me/lessons/{lessonId}/complete',
    tags: ['aluno'],
    summary: 'Marca aula como concluída',
    request: { params: z.object({ lessonId: z.string() }) },
    responses: { 201: { description: 'Registrado' }, 403: { description: 'Não matriculado' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/me/secretaria',
    tags: ['aluno'],
    summary: 'Solicitações da secretaria do aluno',
    responses: { 200: { description: 'OK', ...json(z.array(SecretariaRequest)) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/me/secretaria',
    tags: ['aluno'],
    summary: 'Abre uma solicitação de secretaria',
    request: { body: json(CreateSecretariaInput) },
    responses: { 201: { description: 'Criado', ...json(SecretariaRequest) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/v1/leads',
    tags: ['crm'],
    summary: 'Captura pública de lead (site)',
    request: { body: json(CreateLeadInput) },
    responses: { 201: { description: 'Criado', ...json(Lead) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/kpis',
    tags: ['backoffice'],
    summary: 'KPIs do painel (staff/admin)',
    responses: { 200: { description: 'OK', ...json(Kpis) }, 403: { description: 'Sem permissão' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/courses',
    tags: ['backoffice'],
    summary: 'Lista todos os cursos (inclui rascunhos)',
    responses: { 200: { description: 'OK', ...json(z.array(AdminCourse)) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/students',
    tags: ['backoffice'],
    summary: 'Lista alunos com contagem de matrículas',
    responses: { 200: { description: 'OK', ...json(z.array(Student)) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/leads',
    tags: ['backoffice'],
    summary: 'Lista leads do funil de CRM',
    responses: { 200: { description: 'OK', ...json(z.array(Lead)) } },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Vethis API',
      version: '0.1.0',
      description: 'API da plataforma Vethis — educação médica veterinária.',
    },
    servers: [{ url: '/' }],
  });
}
