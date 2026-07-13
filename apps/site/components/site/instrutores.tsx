type Inst = {
  initial: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
  stats: { value: string; label: string }[];
};

const INSTRUTORES: Inst[] = [
  {
    initial: 'R',
    name: 'Dr. Ricardo Mendes',
    role: 'Cardiologia',
    bio: 'Diretor clínico e pesquisador em cardiologia de pequenos animais.',
    gradient: 'linear-gradient(150deg,#12603f,#0a2b20)',
    stats: [
      { value: '18', label: 'cursos' },
      { value: '4,9', label: 'nota' },
      { value: '6,2k', label: 'alunos' },
    ],
  },
  {
    initial: 'A',
    name: 'Dra. Ana B. Faria',
    role: 'Cirurgia',
    bio: 'Cirurgiã de tecidos moles com mais de 15 anos de centro cirúrgico.',
    gradient: 'linear-gradient(150deg,#3a5a4a,#0f2f24)',
    stats: [
      { value: '22', label: 'cursos' },
      { value: '4,8', label: 'nota' },
      { value: '5,1k', label: 'alunos' },
    ],
  },
  {
    initial: 'C',
    name: 'Dr. Carlos Nunes',
    role: 'Dermatologia',
    bio: 'Especialista em dermatoses e alergias, referência em citologia.',
    gradient: 'linear-gradient(150deg,#8a6a2e,#4a3818)',
    stats: [
      { value: '9', label: 'cursos' },
      { value: '4,9', label: 'nota' },
      { value: '3,8k', label: 'alunos' },
    ],
  },
  {
    initial: 'L',
    name: 'Dra. Lúcia Prado',
    role: 'Anestesiologia',
    bio: 'Anestesiologista de pacientes críticos e docente de pós-graduação.',
    gradient: 'linear-gradient(150deg,#2f5b52,#10302a)',
    stats: [
      { value: '8', label: 'cursos' },
      { value: '4,9', label: 'nota' },
      { value: '2,9k', label: 'alunos' },
    ],
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
                <div className="ph">{i.initial}</div>
              </div>
              <div className="ib">
                <b>{i.name}</b>
                <div className="role">{i.role}</div>
                <p className="bio">{i.bio}</p>
                <div className="st">
                  {i.stats.map((s) => (
                    <div key={s.label}>
                      <b className="num">{s.value}</b>
                      <br />
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
