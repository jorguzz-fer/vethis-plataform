import type { CourseSummary } from '@/lib/api';

type Inst = {
  initial: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
  /** Foto em /public/instrutores; cai para a inicial se o arquivo não existir. */
  photo?: string;
  /**
   * Slug do instrutor no catálogo: se ele tiver foto cadastrada no admin, ela
   * tem prioridade sobre `photo`.
   */
  slug?: string;
  /** Oculta o card sem apagar os dados (para reativar, basta remover a flag). */
  hidden?: boolean;
};

const INSTRUTORES: Inst[] = [
  {
    initial: 'P',
    name: 'Dra. Patrícia Bastos',
    role: 'Coordenação · Medicina Felina',
    bio: 'Coordenadora acadêmica da Pós-graduação em Clínica Médica de Felinos. Médica-veterinária graduada em 1995, especialista em Medicina Felina, Ultrassonografia e Geriatria e Neonatologia, com diplomas internacionais em Medicina Felina e em Nefrologia e Urologia. Veterinária Cat Friendly (AAFP) e palestrante nacional e internacional.',
    gradient: 'linear-gradient(150deg,#12603f,#0a2b20)',
    photo: '/instrutores/patricia.jpg',
    hidden: true,
  },
  {
    initial: 'C',
    name: 'Dra. Cintia Ghorayeb',
    role: 'Coordenação · Clínica Médica',
    bio: 'Coordenadora da Pós-graduação em Clínica Médica de Cães e Gatos. Responde pela integração entre os módulos, pelo alinhamento dos conteúdos ao raciocínio clínico orientado por problemas e pelo acompanhamento do corpo docente e dos encontros síncronos do curso.',
    gradient: 'linear-gradient(150deg,#12603f,#0a2b20)',
    photo: '/instrutores/cintia.jpg',
    slug: 'dra-cintia-ghorayeb',
  },
  {
    initial: 'M',
    name: 'Dr. Márcio Moreira',
    role: 'Coordenação · Mielograma',
    bio: 'Coordenador da Formação em Mielograma e Hematopatologia Medular em Cães e Gatos. Responde pela trilha teórico-prática de leitura do mielograma, da citomorfologia medular ao diagnóstico hematopatológico avançado.',
    gradient: 'linear-gradient(150deg,#2f5a45,#0c2a20)',
    photo: '/instrutores/marcio.jpg',
  },
  {
    initial: 'R',
    name: 'Dra. Roberta Ruiz',
    role: 'Patologia · Medicina Legal',
    bio: 'Especialista em Patologia e Medicina Veterinária Legal, mestre em Biociências e doutoranda em Patologia pela USP. Preside a Comissão de Responsabilidade Técnica do CRMV-SP.',
    gradient: 'linear-gradient(150deg,#3a5a4a,#0f2f24)',
    photo: '/instrutores/roberta.jpg',
  },
];

export function Instrutores({ courses = [] }: { courses?: CourseSummary[] }) {
  // Fotos cadastradas no admin (por slug do instrutor), vindas do catálogo.
  const avatars = new Map<string, string>();
  for (const c of courses) {
    if (c.instructor?.avatarUrl) avatars.set(c.instructor.slug, c.instructor.avatarUrl);
  }
  const visible = INSTRUTORES.filter((i) => !i.hidden).map((i) => ({
    ...i,
    photo: (i.slug && avatars.get(i.slug)) || i.photo,
  }));

  return (
    <section className="blk" id="instrutores">
      <div className="wrap">
        <div className="head-row">
          <div className="lead">
            <span className="eyebrow">Corpo docente</span>
            <h2>Quem ensina, opera todos os dias</h2>
          </div>
          <p className="desc">
            Especialistas com atuação clínica e produção científica, o conhecimento vem direto da
            rotina, não só do papel.
          </p>
        </div>
        <div className="insts">
          {visible.map((i) => (
            <article className="inst-c" key={i.name}>
              <div className="top" style={{ background: i.gradient }}>
                <div className="ph">
                  <span>{i.initial}</span>
                  {i.photo ? (
                    // Foto como background: se o arquivo não existir, a camada fica
                    // transparente e a inicial embaixo aparece (sem imagem quebrada).
                    <span
                      className="ph-photo"
                      role="img"
                      aria-label={i.name}
                      style={{ backgroundImage: `url(${i.photo})` }}
                    />
                  ) : null}
                </div>
              </div>
              <div className="ib">
                <b>{i.name}</b>
                <div className="role">{i.role}</div>
                <p className="bio">{i.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
