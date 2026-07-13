import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

/** URL da área do aluno (app). "Área do aluno" leva direto ao login/app. */
const alunoUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

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
          <a href={alunoUrl} className="signin">
            Área do aluno
          </a>
          <Link href="/cursos" className="btn btn-primary">
            Matricule-se
          </Link>
        </div>
      </div>
    </header>
  );
}
