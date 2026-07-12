export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-green-900 text-[#EAF0EC]">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-2 px-6 py-10">
        <span className="font-serif text-lg font-semibold text-gold-400">Vethis</span>
        <p className="text-sm text-[#B9C7BE]">Educação Médica Veterinária continuada.</p>
        <p className="mt-4 text-xs text-[#8AA096]">
          © {new Date().getFullYear()} Vethis. Conteúdo de demonstração.
        </p>
      </div>
    </footer>
  );
}
