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
  certificateSchema,
  changePasswordSchema,
  coursePlayerSchema,
  createSecretariaSchema,
  enrolledCourseSchema,
  profileSchema,
  secretariaRequestSchema,
  updateProfileSchema,
} from '../me/dto';
import { createCheckoutSchema, orderSchema, paymentWebhookSchema } from '../checkout/dto';
import {
  createLeadSchema,
  createOpportunitySchema,
  leadSchema,
  opportunitySchema,
  updateLeadSchema,
  updateOpportunitySchema,
} from '../crm/dto';
import {
  adminCourseDetailSchema,
  adminCourseSchema,
  adminEnrollmentSchema,
  adminUserSchema,
  createCourseSchema,
  enrollUserSchema,
  createInstructorSchema,
  createLessonSchema,
  createModuleSchema,
  createUserSchema,
  instructorSchema,
  kpisSchema,
  resetPasswordSchema,
  studentSchema,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
  updateUserSchema,
} from '../admin/dto';

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
  const Profile = registry.register('Profile', profileSchema);
  const UpdateProfileInput = registry.register('UpdateProfileInput', updateProfileSchema);
  const ChangePasswordInput = registry.register('ChangePasswordInput', changePasswordSchema);
  const Certificate = registry.register('Certificate', certificateSchema);
  const CreateCheckoutInput = registry.register('CreateCheckoutInput', createCheckoutSchema);
  const Order = registry.register('Order', orderSchema);
  const PaymentWebhookInput = registry.register('PaymentWebhookInput', paymentWebhookSchema);
  const CreateLeadInput = registry.register('CreateLeadInput', createLeadSchema);
  const Lead = registry.register('Lead', leadSchema);
  const Opportunity = registry.register('Opportunity', opportunitySchema);
  const CreateOpportunityInput = registry.register(
    'CreateOpportunityInput',
    createOpportunitySchema,
  );
  const UpdateOpportunityInput = registry.register(
    'UpdateOpportunityInput',
    updateOpportunitySchema,
  );
  const Kpis = registry.register('Kpis', kpisSchema);
  const AdminCourse = registry.register('AdminCourse', adminCourseSchema);
  const AdminCourseDetail = registry.register('AdminCourseDetail', adminCourseDetailSchema);
  const CreateCourseInput = registry.register('CreateCourseInput', createCourseSchema);
  const CreateModuleInput = registry.register('CreateModuleInput', createModuleSchema);
  const UpdateModuleInput = registry.register('UpdateModuleInput', updateModuleSchema);
  const CreateLessonInput = registry.register('CreateLessonInput', createLessonSchema);
  const UpdateLessonInput = registry.register('UpdateLessonInput', updateLessonSchema);
  const Instructor = registry.register('Instructor', instructorSchema);
  const CreateInstructorInput = registry.register('CreateInstructorInput', createInstructorSchema);
  const AdminUser = registry.register('AdminUser', adminUserSchema);
  const AdminEnrollment = registry.register('AdminEnrollment', adminEnrollmentSchema);
  const EnrollUserInput = registry.register('EnrollUserInput', enrollUserSchema);
  const CreateUserInput = registry.register('CreateUserInput', createUserSchema);
  const UpdateUserInput = registry.register('UpdateUserInput', updateUserSchema);
  const ResetPasswordInput = registry.register('ResetPasswordInput', resetPasswordSchema);
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
    path: '/v1/checkout',
    tags: ['checkout'],
    summary: 'Inicia o checkout de um curso (exige sessão)',
    request: { body: json(CreateCheckoutInput) },
    responses: {
      201: { description: 'Pedido criado', ...json(Order) },
      401: { description: 'Não autenticado' },
      409: { description: 'Já matriculado' },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/orders/{id}',
    tags: ['checkout'],
    summary: 'Consulta o pedido (polling do status de pagamento)',
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'OK', ...json(Order) },
      404: { description: 'Não encontrado' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/orders/{id}/simulate-payment',
    tags: ['checkout'],
    summary: 'Simula a confirmação do pagamento (dev; substitui o webhook)',
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'Confirmado', ...json(Order) },
      403: { description: 'Indisponível' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/webhooks/payments',
    tags: ['checkout'],
    summary: 'Webhook de confirmação do gateway de pagamento',
    request: { body: json(PaymentWebhookInput) },
    responses: { 200: { description: 'Recebido' } },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/me/profile',
    tags: ['aluno'],
    summary: 'Perfil do aluno',
    responses: {
      200: { description: 'OK', ...json(Profile) },
      401: { description: 'Não autenticado' },
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/me/profile',
    tags: ['aluno'],
    summary: 'Atualiza o nome do aluno',
    request: { body: json(UpdateProfileInput) },
    responses: { 200: { description: 'OK', ...json(Profile) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/me/password',
    tags: ['aluno'],
    summary: 'Troca a senha (exige a senha atual)',
    request: { body: json(ChangePasswordInput) },
    responses: {
      200: { description: 'Trocada' },
      401: { description: 'Senha atual incorreta' },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/me/courses/{slug}/certificate',
    tags: ['aluno'],
    summary: 'Certificado de conclusão (curso 100% concluído)',
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: { description: 'OK', ...json(Certificate) },
      403: { description: 'Curso não concluído' },
    },
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
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/courses/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza/publica um curso',
    request: {
      params: z.object({ id: z.string() }),
      body: json(registry.register('UpdateCourseInput', updateCourseSchema)),
    },
    responses: { 200: { description: 'OK', ...json(AdminCourse) } },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/leads/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza estágio/notas de um lead',
    request: {
      params: z.object({ id: z.string() }),
      body: json(registry.register('UpdateLeadInput', updateLeadSchema)),
    },
    responses: { 200: { description: 'OK', ...json(Lead) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/opportunities',
    tags: ['backoffice'],
    summary: 'Lista oportunidades do funil de vendas',
    responses: { 200: { description: 'OK', ...json(z.array(Opportunity)) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/opportunities',
    tags: ['backoffice'],
    summary: 'Cria uma oportunidade',
    request: { body: json(CreateOpportunityInput) },
    responses: { 201: { description: 'Criada', ...json(Opportunity) } },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/opportunities/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza uma oportunidade',
    request: {
      params: z.object({ id: z.string() }),
      body: json(UpdateOpportunityInput),
    },
    responses: { 200: { description: 'OK', ...json(Opportunity) } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/opportunities/{id}',
    tags: ['backoffice'],
    summary: 'Exclui uma oportunidade',
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK' } },
  });

  const idParam = { params: z.object({ id: z.string() }) };
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/courses',
    tags: ['backoffice'],
    summary: 'Cria um curso',
    request: { body: json(CreateCourseInput) },
    responses: { 201: { description: 'Criado', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/courses/{id}',
    tags: ['backoffice'],
    summary: 'Detalhe do curso (com módulos e aulas)',
    request: idParam,
    responses: { 200: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/courses/{id}',
    tags: ['backoffice'],
    summary: 'Exclui (soft-delete) um curso',
    request: idParam,
    responses: { 200: { description: 'OK' } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/courses/{id}/modules',
    tags: ['backoffice'],
    summary: 'Cria um módulo no curso',
    request: { ...idParam, body: json(CreateModuleInput) },
    responses: { 201: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/modules/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza um módulo',
    request: { ...idParam, body: json(UpdateModuleInput) },
    responses: { 200: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/modules/{id}',
    tags: ['backoffice'],
    summary: 'Exclui um módulo',
    request: idParam,
    responses: { 200: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/modules/{id}/lessons',
    tags: ['backoffice'],
    summary: 'Cria uma aula no módulo',
    request: { ...idParam, body: json(CreateLessonInput) },
    responses: { 201: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/lessons/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza uma aula',
    request: { ...idParam, body: json(UpdateLessonInput) },
    responses: { 200: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/lessons/{id}',
    tags: ['backoffice'],
    summary: 'Exclui uma aula',
    request: idParam,
    responses: { 200: { description: 'OK', ...json(AdminCourseDetail) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/instructors',
    tags: ['backoffice'],
    summary: 'Lista instrutores',
    responses: { 200: { description: 'OK', ...json(z.array(Instructor)) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/instructors',
    tags: ['backoffice'],
    summary: 'Cria um instrutor',
    request: { body: json(CreateInstructorInput) },
    responses: { 201: { description: 'Criado', ...json(Instructor) } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/users',
    tags: ['backoffice'],
    summary: 'Lista usuários (todos os papéis)',
    responses: { 200: { description: 'OK', ...json(z.array(AdminUser)) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/users',
    tags: ['backoffice'],
    summary: 'Cria um usuário',
    request: { body: json(CreateUserInput) },
    responses: {
      201: { description: 'Criado', ...json(AdminUser) },
      409: { description: 'E-mail já cadastrado' },
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/v1/admin/users/{id}',
    tags: ['backoffice'],
    summary: 'Atualiza nome/papel de um usuário',
    request: { ...idParam, body: json(UpdateUserInput) },
    responses: { 200: { description: 'OK', ...json(AdminUser) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/users/{id}/password',
    tags: ['backoffice'],
    summary: 'Define nova senha para um usuário (reset)',
    request: { ...idParam, body: json(ResetPasswordInput) },
    responses: { 200: { description: 'OK' } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/users/{id}',
    tags: ['backoffice'],
    summary: 'Desativa (soft-delete) um usuário',
    request: idParam,
    responses: { 200: { description: 'OK' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/v1/admin/users/{id}/enrollments',
    tags: ['backoffice'],
    summary: 'Matrículas de um usuário',
    request: idParam,
    responses: { 200: { description: 'OK', ...json(z.array(AdminEnrollment)) } },
  });
  registry.registerPath({
    method: 'post',
    path: '/v1/admin/users/{id}/enrollments',
    tags: ['backoffice'],
    summary: 'Matricula um usuário em um curso',
    request: { ...idParam, body: json(EnrollUserInput) },
    responses: { 200: { description: 'OK', ...json(z.array(AdminEnrollment)) } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/v1/admin/users/{id}/enrollments/{courseId}',
    tags: ['backoffice'],
    summary: 'Remove a matrícula de um usuário em um curso',
    request: { params: z.object({ id: z.string(), courseId: z.string() }) },
    responses: { 200: { description: 'OK', ...json(z.array(AdminEnrollment)) } },
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
