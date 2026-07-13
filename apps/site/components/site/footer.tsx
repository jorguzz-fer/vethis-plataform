import Link from 'next/link';

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <Link href="/#top" className="brand" aria-label="Vethis — início">
              {/* Lockup oficial invertido para branco sobre o fundo escuro do rodapé. */}
              <img
                src="/vethis-logo.png"
                alt="Vethis — Educação Médica Veterinária"
                style={{
                  height: 66,
                  width: 'auto',
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.92,
                }}
              />
            </Link>
            <p className="ft-about">
              Plataforma de educação continuada em medicina veterinária, feita por quem vive a
              clínica. Estude no seu ritmo, com casos reais e certificação.
            </p>
          </div>
          <div className="ft-col">
            <h5>Plataforma</h5>
            <Link href="/#cursos">Cursos</Link>
            <Link href="/#especialidades">Especialidades</Link>
            <Link href="/#app">App móvel</Link>
            <a href="#">Certificados</a>
          </div>
          <div className="ft-col">
            <h5>Instituições</h5>
            <Link href="/#clinicas">Para clínicas</Link>
            <a href="#">Planos de equipe</a>
            <a href="#">Relatórios</a>
            <a href="#">Fale com vendas</a>
          </div>
          <div className="ft-col">
            <h5>Vethis</h5>
            <a href="#">Sobre nós</a>
            <Link href="/#instrutores">Instrutores</Link>
            <a href="#">Blog clínico</a>
            <a href="#">Central de ajuda</a>
          </div>
        </div>
        <div className="ft-bot">
          <span>© 2026 Vethis · Educação Médica Veterinária. Mockup de demonstração.</span>
          <div className="soc">
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 014 0v4" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="12" rx="3" />
                <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
