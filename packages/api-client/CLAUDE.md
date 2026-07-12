# @vethis/api-client

Cliente HTTP **tipado** da API Vethis, consumido por site, área do aluno e backoffice.

## Fonte de verdade

Os tipos em `src/schema.ts` são **gerados** do contrato OpenAPI 3.1 da API
(`apps/api/openapi.json`). Não editar à mão.

```bash
# 1) regerar o contrato (na API), se o schema/rotas mudaram
pnpm --filter @vethis/api openapi:generate
# 2) regerar os tipos do client
pnpm --filter @vethis/api-client generate
```

## Uso

```ts
import { createVethisClient } from '@vethis/api-client';

const api = createVethisClient({ baseUrl: 'https://api.vethis.com.br' });
const { data, error } = await api.GET('/v1/catalog/courses', {
  params: { query: { specialty: 'cardiologia' } },
});
```

`credentials: 'include'` já vai por padrão — o cookie de sessão httpOnly acompanha
as chamadas autenticadas (first-party). Baseado em `openapi-fetch`.
