import Link from 'next/link';

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <span className="eyebrow">Formação contínua para veterinários</span>
          <h1>
            A clínica evolui todo dia.
            <br />
            <em>Seu conhecimento</em> também.
          </h1>
          <p className="hero-sub">
            Cursos de medicina veterinária conduzidos por especialistas que operam na rotina — do
            diagnóstico à cirurgia. Estude no seu ritmo, com casos reais e certificado.
          </p>
          <div className="hero-cta">
            <Link href="/#cta" className="btn btn-gold">
              Explorar cursos
            </Link>
            <Link
              href="/#app"
              className="btn btn-ghost"
              style={{ color: '#EAF1EC', borderColor: 'rgba(255,255,255,.25)' }}
            >
              Ver o app
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="hero-trust">
            <div className="t">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Conteúdo revisado por especialistas
            </div>
            <div className="t">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5" />
              </svg>
              Certificado de conclusão
            </div>
            <div className="t">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7h13v10H3z" />
                <path d="M16 10h3l2 3v4h-5" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
              Acesso offline no app
            </div>
          </div>
        </div>
        <div className="phone-stage">
          <div className="glow" />
          <div className="phone tilt">
            <div className="notch" />
            <div className="screen">
              <div className="stat-bar">
                <span>9:41</span>
                <span className="dots">
                  <i />
                  <i />
                  <i />
                  <i style={{ width: 16, height: 8, borderRadius: 3 }} />
                </span>
              </div>
              <div className="app">
                <div className="app-head">
                  <div className="av">M</div>
                  <div>
                    <div className="hi">Bom dia,</div>
                    <div className="nm">Dra. Marina</div>
                  </div>
                  <div className="bell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
                      <path d="M10.5 21a1.5 1.5 0 003 0" />
                    </svg>
                  </div>
                </div>
                <div className="app-scroll">
                  <div className="app-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4-4" />
                    </svg>
                    Buscar cursos, temas, casos…
                  </div>
                  <div className="chips">
                    <span className="chip on">Todos</span>
                    <span className="chip">Cardiologia</span>
                    <span className="chip">Cirurgia</span>
                    <span className="chip">Derma</span>
                  </div>
                  <div className="continue">
                    <div className="k">Continue de onde parou</div>
                    <div className="t">Cardiologia Clínica — Ausculta e sopros</div>
                    <div className="pbar">
                      <i />
                    </div>
                    <div className="meta">
                      <span>Módulo 4 de 7</span>
                      <span>64% concluído</span>
                    </div>
                  </div>
                  <div className="sec-h">
                    <b>Em destaque</b>
                    <span>Ver tudo</span>
                  </div>
                  <div className="cards2">
                    <div className="mc">
                      <div
                        className="thumb"
                        style={{ background: 'linear-gradient(140deg,#12603f,#0a2e22)' }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.8 6.6a4.6 4.6 0 00-7.8-2.4L12 5.2l-1-1A4.6 4.6 0 003.2 6.6c0 4.9 8.8 10.4 8.8 10.4s8.8-5.5 8.8-10.4z" />
                          <path d="M2 12.5h4l1.5-3 2.5 6 2-4 1.5 1h6.5" stroke="#CDA968" />
                        </svg>
                      </div>
                      <div className="body">
                        <div className="tag">Cardiologia</div>
                        <div className="ti">Emergências cardíacas</div>
                        <div className="row">
                          <span>⭐ 4.9</span>
                          <span className="pr">R$ 349</span>
                        </div>
                      </div>
                    </div>
                    <div className="mc">
                      <div
                        className="thumb"
                        style={{ background: 'linear-gradient(140deg,#8a6a2e,#5a4620)' }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 4l6 6-9 9-6 1 1-6z" />
                          <path d="M12 6l6 6" />
                        </svg>
                      </div>
                      <div className="body">
                        <div className="tag">Cirurgia</div>
                        <div className="ti">Tecidos moles</div>
                        <div className="row">
                          <span>⭐ 4.8</span>
                          <span className="pr">R$ 429</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tabbar">
                  <a className="on">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 11l9-7 9 7" />
                      <path d="M5 10v10h14V10" />
                    </svg>
                    Início
                  </a>
                  <a>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 5h16v14H4z" />
                      <path d="M10 9l5 3-5 3z" />
                    </svg>
                    Cursos
                  </a>
                  <a>
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
                    Progresso
                  </a>
                  <a>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                    </svg>
                    Perfil
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
