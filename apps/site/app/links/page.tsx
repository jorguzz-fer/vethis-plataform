import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { formatBRL } from '@vethis/shared';
import { getCourses, type CourseSummary } from '@/lib/api';
import { offerPlans } from '@/lib/pricing';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';
import styles from './links.module.css';

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const DESCRIPTION =
  'Pós-graduações reconhecidas pelo MEC e cursos livres para médicos-veterinários. 100% online, com casos reais.';

export const metadata: Metadata = {
  title: 'Links',
  description: DESCRIPTION,
  // Página de link-in-bio: não compete com a home nos buscadores.
  robots: { index: false, follow: true },
  alternates: { canonical: '/links' },
  openGraph: {
    title: 'Vethis · Educação Médica Veterinária',
    description: DESCRIPTION,
    url: `${SITE_URL}/links`,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

const ALUNO_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';
const WHATSAPP =
  'https://wa.me/5512953711800?text=Ol%C3%A1%2C%20Vera.%20Vim%20pelo%20Instagram%20e%20quero%20saber%20mais%20sobre%20os%20cursos%20da%20Vethis.';

/** Todo clique desta página entra no funil como instagram/links. */
function utm(path: string, content: string): string {
  return `${path}?utm_source=instagram&utm_medium=links&utm_content=${encodeURIComponent(content)}`;
}

/** "Pós-graduação em X" → tipo "Pós-graduação" + título "X" (como no layout aprovado). */
function splitTitle(title: string): { kind: string; name: string } {
  const rules: Array<[RegExp, string]> = [
    [/^Pós-graduação em\s+/i, 'Pós-graduação'],
    [/^Formação em\s+/i, 'Formação'],
    [/^Curso de\s+/i, 'Curso livre'],
  ];
  for (const [re, kind] of rules) {
    if (re.test(title)) return { kind, name: title.replace(re, '') };
  }
  return { kind: 'Curso', name: title };
}

function CourseCard({ c }: { c: CourseSummary }) {
  const { kind, name } = splitTitle(c.title);
  const plans = offerPlans(c);
  const top = plans[plans.length - 1]!;
  return (
    <a
      className={`${styles.course} ${c.comingSoon ? styles.soon : ''}`}
      href={utm(`/cursos/${c.slug}`, c.slug)}
    >
      <p className={styles.kind}>{kind}</p>
      <h2>{name}</h2>
      <p className={styles.meta}>
        {c.instructor ? (
          <>
            <b>{c.instructor.name}</b> · Coordenação
            <br />
          </>
        ) : null}
        {c.subtitle}
      </p>
      <div className={styles.row}>
        {c.comingSoon ? (
          <>
            <div className={styles.price}>
              Matrículas
              <strong>Em breve</strong>
            </div>
            <span className={`${styles.btn} ${styles.btnGold}`}>Quero ser avisado</span>
          </>
        ) : (
          <>
            <div className={styles.price}>
              {top.installments > 1 ? `até ${top.installments}x de` : 'à vista'}
              <strong>{formatBRL(top.installmentCents)}</strong>
            </div>
            <span className={`${styles.btn} ${styles.btnPrimary}`}>Garantir minha vaga</span>
          </>
        )}
      </div>
    </a>
  );
}

export default async function LinksPage() {
  const courses = await getCourses();
  // Disponíveis primeiro, "Em breve" depois — cada grupo na ordem de destaque do admin.
  const open = courses.filter((c) => !c.comingSoon);
  const soon = courses.filter((c) => c.comingSoon);

  return (
    <div className={`${styles.page} ${montserrat.className}`}>
      <div className={styles.wrap}>
        <header className={styles.head}>
          <img
            src="/vethis-logo.png"
            alt="Vethis · Educação Médica Veterinária"
            width={560}
            height={463}
          />
          <h1>
            A clínica evolui todo dia. <em>Seu conhecimento</em> também.
          </h1>
          <p>Pós-graduações e cursos para médicos-veterinários, 100% online e com casos reais.</p>
        </header>

        <div
          className={styles.cred}
          aria-label="Reconhecido pelo MEC, em parceria com a Rede de Ensino Doctum"
        >
          <img src="/mec.jpg" alt="Reconhecido pelo MEC" />
          <span>
            Reconhecido pelo MEC
            <br />
            Rede de Ensino Doctum
          </span>
          <img src="/doctum.jpg" alt="Rede de Ensino Doctum" />
        </div>

        {open.length > 0 ? (
          <section className={styles.section}>
            <p className={styles.overline}>Matrículas abertas</p>
            {open.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </section>
        ) : null}

        {soon.length > 0 ? (
          <section className={styles.section}>
            <p className={styles.overline}>Em breve</p>
            {soon.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </section>
        ) : null}

        <section className={`${styles.section} ${styles.stack}`}>
          <a className={`${styles.btn} ${styles.btnWa}`} href={WHATSAPP}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z" />
              <path d="M9.5 9.5c0 2.5 2.5 5 5 5l1.5-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" />
            </svg>
            <span className={styles.txt}>
              Falar com a Vera no WhatsApp
              <small>Tira dúvidas sobre matrícula, grade e certificado</small>
            </span>
          </a>
          <a className={`${styles.btn} ${styles.btnOutline}`} href={utm('/cursos', 'catalogo')}>
            Ver todos os cursos
          </a>
          <a className={`${styles.btn} ${styles.btnSoft}`} href={utm(ALUNO_URL, 'area-aluno')}>
            Área do aluno
          </a>
        </section>

        <footer className={styles.foot}>
          <div className={styles.social}>
            <a href="https://www.instagram.com/vethiseducacao/" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
              </svg>
            </a>
            <a href={SITE_URL} aria-label="Site">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            </a>
          </div>
          Já formamos mais de 15.000 veterinários em todo o Brasil.
          <br />
          Cursos certificados e reconhecidos pelo MEC, em parceria com a Rede de Ensino Doctum.
          <br />
          <a href={SITE_URL}>vethis.com.br</a> · © {new Date().getFullYear()} Vethis
        </footer>
      </div>
    </div>
  );
}
