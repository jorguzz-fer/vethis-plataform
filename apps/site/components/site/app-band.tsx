const tabSvg = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function TabBar({ active }: { active: 'inicio' | 'cursos' | 'progresso' | 'perfil' }) {
  return (
    <div className="tabbar">
      <a className={active === 'inicio' ? 'on' : undefined}>
        <svg viewBox="0 0 24 24" {...tabSvg}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v10h14V10" />
        </svg>
        Início
      </a>
      <a className={active === 'cursos' ? 'on' : undefined}>
        <svg viewBox="0 0 24 24" {...tabSvg}>
          <path d="M4 5h16v14H4z" />
          <path d="M10 9l5 3-5 3z" />
        </svg>
        Cursos
      </a>
      <a className={active === 'progresso' ? 'on' : undefined}>
        <svg viewBox="0 0 24 24" {...tabSvg}>
          <path d="M4 19V5m5 14V9m5 10V4m5 15v-8" />
        </svg>
        Progresso
      </a>
      <a className={active === 'perfil' ? 'on' : undefined}>
        <svg viewBox="0 0 24 24" {...tabSvg}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
        Perfil
      </a>
    </div>
  );
}

function StatBar() {
  return (
    <div className="stat-bar">
      <span>9:41</span>
      <span className="dots">
        <i />
        <i />
        <i />
        <i style={{ width: 16, height: 8, borderRadius: 3 }} />
      </span>
    </div>
  );
}

export function AppBand() {
  return (
    <section className="app-band" id="app">
      <div className="wrap app-band-in">
        <div className="app-copy">
          <span className="eyebrow">No seu bolso</span>
          <h2>A plantão inteira cabe no seu celular</h2>
          <p className="desc">
            Baixe as aulas, revise protocolos entre atendimentos e acompanhe seu progresso — mesmo
            sem internet, direto do centro cirúrgico ou da fazenda.
          </p>
          <ul className="feat">
            <li>
              <span className="fi">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12M8 11l4 4 4-4" />
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
              </span>
              <div>
                <b>Aulas offline</b>
                <span>Baixe e assista onde estiver, sem depender de sinal.</span>
              </div>
            </li>
            <li>
              <span className="fi">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5" />
                </svg>
              </span>
              <div>
                <b>Certificados válidos</b>
                <span>Emita comprovantes de horas para o seu currículo.</span>
              </div>
            </li>
            <li>
              <span className="fi">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19V5m5 14V9m5 10V4m5 15v-8" />
                </svg>
              </span>
              <div>
                <b>Progresso e metas</b>
                <span>Trilhas com marcos claros e retomada de onde parou.</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="phones">
          <div className="phone">
            <div className="screen">
              <StatBar />
              <div className="app">
                <div className="player-top">
                  <span className="tt">Cardiologia · Aula 12</span>
                  <div className="pl">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="dur">18:24</span>
                </div>
                <div className="p2">
                  <h4>Ausculta cardíaca e sopros</h4>
                  <div className="by">Dr. Ricardo Mendes</div>
                  <div className="prog">
                    <span>Progresso do módulo</span>
                    <span>64%</span>
                  </div>
                  <div className="pbar" style={{ marginBottom: 8 }}>
                    <i style={{ width: '64%' }} />
                  </div>
                  <div className="les done">
                    <div className="ix">✓</div>
                    <div>
                      <div className="lt">Anatomia funcional</div>
                      <div className="lm">Concluída</div>
                    </div>
                    <div className="rt">12min</div>
                  </div>
                  <div className="les done">
                    <div className="ix">✓</div>
                    <div>
                      <div className="lt">Focos de ausculta</div>
                      <div className="lm">Concluída</div>
                    </div>
                    <div className="rt">09min</div>
                  </div>
                  <div className="les now">
                    <div className="ix">▶</div>
                    <div>
                      <div className="lt">Sopros: classificação</div>
                      <div className="lm">Assistindo agora</div>
                    </div>
                    <div className="rt">18min</div>
                  </div>
                  <div className="les">
                    <div className="ix lock">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 018 0v3" />
                      </svg>
                    </div>
                    <div>
                      <div className="lt">Casos clínicos</div>
                      <div className="lm">Bloqueada</div>
                    </div>
                    <div className="rt">22min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="phone">
            <div className="screen">
              <StatBar />
              <div className="app">
                <div className="app-head" style={{ paddingTop: 12 }}>
                  <div>
                    <div className="hi">Meu progresso</div>
                    <div className="nm">Trilha de Cardiologia</div>
                  </div>
                </div>
                <div className="app-scroll">
                  <div
                    className="continue"
                    style={{ background: 'linear-gradient(120deg,#8a6a2e,#4a3818)' }}
                  >
                    <div className="k" style={{ color: '#f2e6c9' }}>
                      Sequência de estudos
                    </div>
                    <div className="t">12 dias seguidos 🔥</div>
                    <div className="meta" style={{ color: '#efe2c4' }}>
                      <span>Meta semanal: 5h</span>
                      <span>4h 20m</span>
                    </div>
                  </div>
                  <div className="sec-h">
                    <b>Certificados</b>
                    <span>3</span>
                  </div>
                  <div className="les done" style={{ borderTop: 0 }}>
                    <div className="ix">✓</div>
                    <div>
                      <div className="lt">Emergências Cardíacas</div>
                      <div className="lm">28h · concluído</div>
                    </div>
                    <div className="rt">★4,9</div>
                  </div>
                  <div className="les done">
                    <div className="ix">✓</div>
                    <div>
                      <div className="lt">Radiologia Torácica</div>
                      <div className="lm">16h · concluído</div>
                    </div>
                    <div className="rt">★4,8</div>
                  </div>
                  <div className="sec-h" style={{ marginTop: 12 }}>
                    <b>Em andamento</b>
                    <span>2</span>
                  </div>
                  <div className="les now" style={{ borderTop: 0 }}>
                    <div className="ix">▶</div>
                    <div>
                      <div className="lt">Cardiologia Clínica</div>
                      <div className="lm">64% · módulo 4/7</div>
                    </div>
                    <div className="rt">28h</div>
                  </div>
                  <div className="les now">
                    <div
                      className="ix"
                      style={{ background: 'rgba(184,147,90,.25)', color: '#e2c07f' }}
                    >
                      ▶
                    </div>
                    <div>
                      <div className="lt">Anestesia em Críticos</div>
                      <div className="lm">22% · módulo 1/5</div>
                    </div>
                    <div className="rt">18h</div>
                  </div>
                </div>
                <TabBar active="progresso" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
