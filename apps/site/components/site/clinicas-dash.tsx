const sideSvg = { fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1.8' };

export function ClinicasDash() {
  return (
    <section className="dash" id="clinicas">
      <div className="wrap dash-in">
        <span className="eyebrow">Para clínicas e instituições</span>
        <h2>Gestão de aprendizagem para a sua equipe</h2>
        <p className="lead-p">
          Matricule sua equipe, acompanhe conclusões e horas de formação e comprove a capacitação
          continuada — tudo em um painel.
        </p>

        <div className="browser">
          <div className="b-bar">
            <i style={{ background: '#e56a5a' }} />
            <i style={{ background: '#e5b74e' }} />
            <i style={{ background: '#5fc08a' }} />
            <span className="u">app.vethis.com.br/painel/instituicao</span>
          </div>
          <div className="b-body">
            <aside className="side">
              <div className="sb-brand">
                <img src="/vethis-mark.png" alt="" />
                Vethis
              </div>
              <a className="on">
                <svg viewBox="0 0 24 24" {...sideSvg}>
                  <path d="M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-4H4z" />
                </svg>
                Visão geral
              </a>
              <a>
                <svg viewBox="0 0 24 24" {...sideSvg}>
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 19c0-3 3-5 6.5-5s6.5 2 6.5 5M17 8a3 3 0 010 6" />
                </svg>
                Equipe
              </a>
              <a>
                <svg viewBox="0 0 24 24" {...sideSvg}>
                  <path d="M4 5h16v14H4z" />
                  <path d="M10 9l5 3-5 3z" />
                </svg>
                Cursos
              </a>
              <a>
                <svg viewBox="0 0 24 24" {...sideSvg}>
                  <path d="M4 19V5m5 14V9m5 10V4m5 15v-8" />
                </svg>
                Relatórios
              </a>
              <div className="sb-lbl">Conta</div>
              <a>
                <svg viewBox="0 0 24 24" {...sideSvg}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" />
                </svg>
                Configurações
              </a>
            </aside>
            <div className="panel">
              <div className="panel-h">
                <h3>Visão geral · Clínica VetSaúde</h3>
                <div className="who">
                  <span>Julho 2026</span>
                  <span className="av">J</span>
                </div>
              </div>
              <div className="kpis">
                <div className="kpi">
                  <div className="kl">
                    <svg viewBox="0 0 24 24" {...sideSvg}>
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 19c0-3 3-5 6.5-5s6.5 2 6.5 5" />
                    </svg>
                    Alunos ativos
                  </div>
                  <div className="kv num">48</div>
                  <div className="kt up">▲ 12% vs. jun</div>
                </div>
                <div className="kpi">
                  <div className="kl">
                    <svg viewBox="0 0 24 24" {...sideSvg}>
                      <circle cx="12" cy="8" r="5" />
                      <path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5" />
                    </svg>
                    Conclusões
                  </div>
                  <div className="kv num">126</div>
                  <div className="kt up">▲ 23% vs. jun</div>
                </div>
                <div className="kpi">
                  <div className="kl">
                    <svg viewBox="0 0 24 24" {...sideSvg}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    Horas de formação
                  </div>
                  <div className="kv num">1.940</div>
                  <div className="kt up">▲ 8% vs. jun</div>
                </div>
                <div className="kpi">
                  <div className="kl">
                    <svg viewBox="0 0 24 24" {...sideSvg}>
                      <path d="M4 19V5m5 14V9m5 10V4" />
                    </svg>
                    Engajamento
                  </div>
                  <div className="kv num">82%</div>
                  <div className="kt dn">▼ 3% vs. jun</div>
                </div>
              </div>
              <div className="grid2">
                <div className="card-d">
                  <div className="cdh">
                    <b>Conclusões por mês</b>
                    <div className="lg">
                      <span>
                        <i style={{ background: '#CDA968' }} />
                        Concluídos
                      </span>
                      <span>
                        <i style={{ background: 'rgba(184,147,90,.3)' }} />
                        Matrículas
                      </span>
                    </div>
                  </div>
                  <svg
                    className="chart"
                    viewBox="0 0 520 170"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Gráfico de conclusões por mês, tendência de alta"
                  >
                    <defs>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#CDA968" stopOpacity=".38" />
                        <stop offset="1" stopColor="#CDA968" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="520" y2="30" stroke="rgba(255,255,255,.06)" />
                    <line x1="0" y1="70" x2="520" y2="70" stroke="rgba(255,255,255,.06)" />
                    <line x1="0" y1="110" x2="520" y2="110" stroke="rgba(255,255,255,.06)" />
                    <line x1="0" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,.08)" />
                    <path
                      d="M0,140 L74,120 L149,128 L223,96 L297,104 L371,70 L446,58 L520,34 L520,170 L0,170 Z"
                      fill="url(#ga)"
                    />
                    <path
                      d="M0,140 L74,120 L149,128 L223,96 L297,104 L371,70 L446,58 L520,34"
                      fill="none"
                      stroke="#CDA968"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M0,150 L74,138 L149,140 L223,124 L297,122 L371,104 L446,96 L520,80"
                      fill="none"
                      stroke="rgba(184,147,90,.4)"
                      strokeWidth="1.6"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx="520"
                      cy="34"
                      r="4.5"
                      fill="#CDA968"
                      stroke="#0b1f18"
                      strokeWidth="2"
                    />
                  </svg>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: '#7d968a',
                      marginTop: 6,
                    }}
                  >
                    <span>Dez</span>
                    <span>Jan</span>
                    <span>Fev</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>Mai</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>
                <div className="card-d">
                  <div className="cdh">
                    <b>Turmas ativas</b>
                    <span style={{ fontSize: '10.5px', color: '#93a99d' }}>4 trilhas</span>
                  </div>
                  <div className="tbl">
                    <div className="tr">
                      <div className="nmw">
                        <span
                          className="ci"
                          style={{ background: 'linear-gradient(135deg,#12603f,#0a2e22)' }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M20.8 6.6a4.6 4.6 0 00-7.8-2.4L12 5.2l-1-1A4.6 4.6 0 003.2 6.6c0 4.9 8.8 10.4 8.8 10.4s8.8-5.5 8.8-10.4z" />
                          </svg>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="t1">Cardiologia Clínica</div>
                          <div className="t2">18 alunos</div>
                        </div>
                      </div>
                      <div className="prg">
                        <div className="track">
                          <i style={{ width: '72%' }} />
                        </div>
                        <span className="pv num">72%</span>
                      </div>
                    </div>
                    <div className="tr">
                      <div className="nmw">
                        <span
                          className="ci"
                          style={{ background: 'linear-gradient(135deg,#3a5a4a,#0f2f24)' }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M14 3.5l6.5 6.5-9.5 9.5L4 21l1.5-7z" />
                          </svg>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="t1">Cirurgia de Tecidos Moles</div>
                          <div className="t2">12 alunos</div>
                        </div>
                      </div>
                      <div className="prg">
                        <div className="track">
                          <i style={{ width: '45%' }} />
                        </div>
                        <span className="pv num">45%</span>
                      </div>
                    </div>
                    <div className="tr">
                      <div className="nmw">
                        <span
                          className="ci"
                          style={{ background: 'linear-gradient(135deg,#8a6a2e,#4a3818)' }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M4 7h9a4 4 0 010 8h-2l-1 5H8l-1-5H4z" />
                          </svg>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="t1">Dermatologia</div>
                          <div className="t2">9 alunos</div>
                        </div>
                      </div>
                      <div className="prg">
                        <div className="track">
                          <i style={{ width: '88%' }} />
                        </div>
                        <span className="pv num">88%</span>
                      </div>
                    </div>
                    <div className="tr">
                      <div className="nmw">
                        <span
                          className="ci"
                          style={{ background: 'linear-gradient(135deg,#2f5b52,#10302a)' }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M12 3c-3 0-5 2-5 5 0 4 1.5 5 2 9 .3 2.3.8 4 3 4s2.7-1.7 3-4c.5-4 2-5 2-9 0-3-2-5-5-5z" />
                          </svg>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="t1">Anestesiologia</div>
                          <div className="t2">9 alunos</div>
                        </div>
                      </div>
                      <div className="prg">
                        <div className="track">
                          <i style={{ width: '22%' }} />
                        </div>
                        <span className="pv num">22%</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="pill pos">32 em dia</span>
                    <span className="pill warn">11 atrasados</span>
                    <span className="pill risk">5 em risco</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
