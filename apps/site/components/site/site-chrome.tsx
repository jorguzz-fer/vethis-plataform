'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Rotas "standalone" (sem cabeçalho/rodapé do site), ex.: link-in-bio. */
const BARE_PREFIXES = ['/links'];

/**
 * Decide no cliente se a página recebe o cabeçalho e o rodapé do site. Header e
 * Footer continuam componentes de servidor: chegam prontos por props.
 */
export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const bare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (bare) return <main id="top">{children}</main>;
  return (
    <>
      {header}
      <main id="top">{children}</main>
      {footer}
    </>
  );
}
