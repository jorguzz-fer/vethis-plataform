import { planTasksUrl, proxyPlanTasks } from '../../plan-tasks-proxy';

/** Marca ou desmarca uma tarefa do plano de marketing (repasse para a API). */
export const dynamic = 'force-dynamic';

const KEY = /^[a-z0-9-]{2,40}$/;

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await ctx.params;
  if (!KEY.test(key)) {
    return Response.json({ message: 'Chave de tarefa inválida' }, { status: 400 });
  }
  const body = await req.text();
  return proxyPlanTasks(planTasksUrl(key), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
  });
}
