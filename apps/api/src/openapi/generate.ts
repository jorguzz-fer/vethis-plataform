import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOpenApiDocument } from './document';

/** Escreve o contrato em apps/api/openapi.json (usado pela geração do api-client). */
const out = resolve(__dirname, '../../openapi.json');
writeFileSync(out, JSON.stringify(buildOpenApiDocument(), null, 2) + '\n');
console.log(`OpenAPI escrito em ${out}`);
