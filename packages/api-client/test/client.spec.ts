import { describe, expect, it, vi } from 'vitest';
import { createVethisClient } from '../src/index';

describe('createVethisClient', () => {
  it('cria um client com os verbos tipados', () => {
    const client = createVethisClient({ baseUrl: 'http://localhost:3333' });
    expect(typeof client.GET).toBe('function');
    expect(typeof client.POST).toBe('function');
  });

  it('usa o fetch injetado e envia credenciais', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const client = createVethisClient({ baseUrl: 'http://api.test', fetch: fetchMock });
    await client.GET('/v1/catalog/specialties');
    expect(fetchMock).toHaveBeenCalledOnce();
    const req = fetchMock.mock.calls[0]![0] as Request;
    expect(req.url).toBe('http://api.test/v1/catalog/specialties');
    expect(req.credentials).toBe('include');
  });
});
