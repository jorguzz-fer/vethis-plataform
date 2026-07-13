import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href="/#top" className="brand" aria-label="Vethis — início">
          <img src="/vethis-mark.png" alt="" style={{ height: 30, width: 'auto' }} />
          <span>
            Vethis<span className="b-sub">Educação Médica Veterinária</span>
          </span>
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
