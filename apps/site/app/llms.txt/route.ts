import { getCourses } from '@/lib/api';
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * llms.txt — índice do site legível por LLMs/buscadores generativos (GEO).
 * Padrão emergente em Markdown: resume o que é o site e lista os recursos.
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const courses = await getCourses();
  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'A Vethis é uma plataforma brasileira de educação médica veterinária continuada, com',
    'pós-graduações e cursos livres 100% online, conduzidos por especialistas e baseados em',
    'casos reais da rotina clínica.',
    '',
    '## Cursos',
    '',
    ...courses.map((c) => {
      const desc = (c.subtitle ?? '').replace(/\s+/g, ' ').trim();
      return `- [${c.title}](${absoluteUrl(`/cursos/${c.slug}`)})${desc ? `: ${desc}` : ''}`;
    }),
    '',
    '## Links',
    '',
    `- [Catálogo de cursos](${absoluteUrl('/cursos')})`,
    `- [Site](${SITE_URL})`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
