import Link from 'next/link';
import { LeadFormTrigger } from './lead-form';
import { Credenciamento } from './credenciamento';
import { INSTAGRAM_URL, WHATSAPP_URL } from '@/lib/contact';

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <Link href="/#top" className="brand" aria-label="Vethis · início">
              {/* Lockup oficial invertido para branco sobre o fundo escuro do rodapé. */}
              <img
                src="/vethis-logo.png"
                alt="Vethis · Educação Médica Veterinária"
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
            <Link href="/cursos">Pós-graduação</Link>
            <Link href="/cursos">Cursos livres</Link>
            <Link href="/#especialidades">Especialidades</Link>
            <a href="#certificacao">Certificados</a>
          </div>
          <div className="ft-col">
            <h5>Instituições</h5>
            <Link href="/#clinicas">Para clínicas</Link>
            <Link href="/#clinicas">Relatórios da equipe</Link>
            <LeadFormTrigger
              source="site-footer"
              className="ft-link-btn"
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                font: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Fale com vendas
            </LeadFormTrigger>
          </div>
          <div className="ft-col">
            <h5>Vethis</h5>
            <Link href="/#instrutores">Instrutores</Link>
            <Link href="/links">Todos os links</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              Central de ajuda (WhatsApp)
            </a>
          </div>
        </div>
        <div id="certificacao">
          <Credenciamento dark className="border-t border-white/10 py-6" />
        </div>
        <div className="ft-bot">
          <span>© 2026 Vethis · Educação Médica Veterinária.</span>
          <div className="soc">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 11.5a8.5 8.5 0 01-12.6 7.4L3.5 20l1.1-3.8A8.5 8.5 0 1120 11.5z" />
                <path d="M9 8.5c.2 2.6 2.4 5 5 5.5l1.2-1.2 2 .9-.4 1.8c-4.2.4-8.4-3.6-8.1-8l1.8-.4.9 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
