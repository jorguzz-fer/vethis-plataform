import Link from 'next/link';
import { Button } from '@vethis/ui';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1140px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-md bg-green-700 font-serif text-lg font-semibold text-gold-400"
          >
            V
          </span>
          <span className="font-serif text-xl font-semibold text-green-800">Vethis</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <Link href="/cursos" className="hover:text-green-700">
            Cursos
          </Link>
          <Link href="/#especialidades" className="hover:text-green-700">
            Especialidades
          </Link>
          <Link href="/#clinicas" className="hover:text-green-700">
            Para clínicas
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cursos">
            <Button variant="text" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/cursos">
            <Button variant="primary" size="sm">
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
