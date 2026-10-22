const baseUrl = process.env.API_URL ?? 'http://localhost:3333';

export function planTasksUrl(key?: string): string {
  return key ? `${baseUrl}/v1/plan/tasks/${key}` : `${baseUrl}/v1/plan/tasks`;
}

/**
 * Repassa a chamada para a API e devolve o status e o corpo como vieram. Em
 * falha de rede responde 502 com JSON, para a página mostrar o aviso e
 * reverter a marcação otimista.
 */
export async function proxyPlanTasks(url: string, init: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return Response.json({ message: 'API indisponível' }, { status: 502 });
  }
}
