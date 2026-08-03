/**
 * Faixa de credenciamento: selo "Reconhecido pelo MEC" + logo da Rede de
 * Ensino Doctum + nota de revisão por especialistas. Usada no rodapé (fundo
 * escuro) e na página do curso (fundo claro) — `dark` ajusta a cor do texto.
 */
export function Credenciamento({
  dark = false,
  className = '',
}: {
  dark?: boolean;
  className?: string;
}) {
  const text = dark ? 'text-[#C6D3CA]' : 'text-muted';
  const strong = dark ? 'text-white' : 'text-ink';
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1 shadow-sm">
          <img src="/mec.jpg" alt="Reconhecido pelo MEC" className="max-h-full w-auto" />
        </span>
        <span className="flex h-12 items-center rounded-xl bg-white px-3 shadow-sm">
          <img src="/doctum.jpg" alt="Rede de Ensino Doctum" className="max-h-7 w-auto" />
        </span>
      </div>
      <p className={`max-w-md text-[13px] leading-relaxed ${text}`}>
        Cursos{' '}
        <span className={`font-semibold ${strong}`}>certificados e reconhecidos pelo MEC</span>, em
        parceria com a <span className={`font-semibold ${strong}`}>Rede de Ensino Doctum</span>.
        Conteúdo revisado por especialistas.
      </p>
    </div>
  );
}
