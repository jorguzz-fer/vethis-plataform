type Inst = {
  initial: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
  /** Foto em /public/instrutores; cai para a inicial se o arquivo não existir. */
  photo?: string;
};

const INSTRUTORES: Inst[] = [
  {
    initial: 'P',
    name: 'Dra. Patrícia Bastos',
    role: 'Coordenação · Medicina Felina',
    bio: 'Coordenadora acadêmica da Pós-graduação em Clínica Médica de Felinos. Médica-veterinária com atuação clínica e docente em Medicina Felina, com ensino baseado em casos reais.',
    gradient: 'linear-gradient(150deg,#12603f,#0a2b20)',
    photo: '/instrutores/patricia.jpg',
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

export function Instrutores() {
  return (
    <section className="blk" id="instrutores">
      <div className="wrap">
        <div className="head-row">
          <div className="lead">
            <span className="eyebrow">Corpo docente</span>
            <h2>Quem ensina, opera todos os dias</h2>
          </div>
          <p className="desc">
            Especialistas com atuação clínica e produção científica — o conhecimento vem direto da
            rotina, não só do papel.
          </p>
        </div>
        <div className="insts">
          {INSTRUTORES.map((i) => (
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
