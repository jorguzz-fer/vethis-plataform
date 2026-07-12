import { Controller, Get } from '@nestjs/common';
import { buildOpenApiDocument } from './document';

/** Expõe o contrato OpenAPI em GET /v1/openapi.json. */
@Controller({ path: 'openapi.json', version: '1' })
export class OpenApiController {
  private readonly document = buildOpenApiDocument();

  @Get()
  get(): object {
    return this.document;
  }
}
