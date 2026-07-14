import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { AttributionTracker } from '@/components/site/attribution-tracker';
import './globals.css';
import './prototype.css';

export const metadata: Metadata = {
  title: 'Vethis — Educação Médica Veterinária',
  description:
    'Formação médica veterinária continuada, baseada em casos reais. Cursos por especialidade.',
};

// Aplica o tema (claro/escuro) por `data-theme` antes da pintura, replicando o
// <script> do protótipo: usa a preferência salva em localStorage e cai para o
// esquema do sistema. Evita flash de tema incorreto no carregamento.
const themeInit = `(function(){try{var t=localStorage.getItem('vethis-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <AttributionTracker />
        <Header />
        <main id="top">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
