import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from '../src/openapi/document';

describe('buildOpenApiDocument', () => {
  const doc = buildOpenApiDocument();

  it('gera um documento OpenAPI 3.1 válido', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('Vethis API');
  });

  it('expõe as rotas de auth e catálogo', () => {
    expect(doc.paths?.['/v1/auth/login']).toBeDefined();
    expect(doc.paths?.['/v1/catalog/courses']).toBeDefined();
    expect(doc.paths?.['/v1/catalog/courses/{slug}']).toBeDefined();
  });

  it('expõe as rotas de checkout', () => {
    expect(doc.paths?.['/v1/checkout']).toBeDefined();
    expect(doc.paths?.['/v1/orders/{id}']).toBeDefined();
    expect(doc.paths?.['/v1/webhooks/payments']).toBeDefined();
  });

  it('expõe as rotas de perfil e certificado', () => {
    expect(doc.paths?.['/v1/me/profile']).toBeDefined();
    expect(doc.paths?.['/v1/me/password']).toBeDefined();
    expect(doc.paths?.['/v1/me/courses/{slug}/certificate']).toBeDefined();
  });

  it('registra os schemas de resposta', () => {
    const schemas = doc.components?.schemas ?? {};
    expect(schemas['CourseSummary']).toBeDefined();
    expect(schemas['CourseDetail']).toBeDefined();
    expect(schemas['PublicUser']).toBeDefined();
    expect(schemas['Order']).toBeDefined();
    expect(schemas['CreateCheckoutInput']).toBeDefined();
  });
});
