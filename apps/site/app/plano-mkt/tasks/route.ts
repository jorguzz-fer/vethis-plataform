import { planTasksUrl, proxyPlanTasks } from '../plan-tasks-proxy';

/**
 * Estado das tarefas do plano de marketing (/plano-mkt). O HTML estático chama
 * esta rota no próprio domínio e o site repassa para a API (API_URL é
 * server-side), sem CORS nem URL da API embutida na página.
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return proxyPlanTasks(planTasksUrl(), { method: 'GET' });
}
