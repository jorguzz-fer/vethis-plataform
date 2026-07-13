import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href="/#top" className="brand" aria-label="Vethis — início">
          <img
            src="/vethis-logo.png"
            alt="Vethis — Educação Médica Veterinária"
            style={{ height: 68, width: 'auto' }}
          />
        </Link>
        <nav className="nav-links" aria-label="Principal">
          <Link href="/#especialidades">Especialidades</Link>
          <Link href="/#cursos">Cursos</Link>
          <Link href="/#app">App</Link>
          <Link href="/#clinicas">Para Clínicas</Link>
          <Link href="/#instrutores">Instrutores</Link>
        </nav>
        <div className="nav-right">
          <ThemeToggle />
          <Link href="/cursos" className="signin">
            Entrar
          </Link>
          <Link href="/#cta" className="btn btn-primary">
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}
