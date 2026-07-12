import Link from 'next/link';
import { Button } from '@vethis/ui';

export function Hero() {
  return (
    <section className="bg-green-900 text-[#EAF0EC]">
      <div className="mx-auto max-w-[1140px] px-6 py-20 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[2px] text-gold-400">
          Educação Médica Veterinária
        </p>
        <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.08] md:text-6xl">
          Evolua sua prática clínica com <em className="not-italic text-gold-400">casos reais</em>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[#C6D3CA]">
          Cursos por especialidade, ministrados por quem vive a clínica. Do diagnóstico ao laudo, no
          seu ritmo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cursos">
            <Button variant="gold">Explorar cursos</Button>
          </Link>
          <Link href="/#especialidades">
            <Button
              variant="outline"
              className="border-[#EAF0EC]/40 text-[#EAF0EC] hover:bg-white/5"
            >
              Ver especialidades
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
