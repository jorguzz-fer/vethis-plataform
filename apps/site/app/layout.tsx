import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { AttributionTracker } from '@/components/site/attribution-tracker';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo';
import './globals.css';
import './prototype.css';

const TITLE_DEFAULT = 'Vethis · Educação Médica Veterinária';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE_DEFAULT, template: '%s · Vethis' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'educação médica veterinária',
    'cursos de veterinária',
    'pós-graduação veterinária',
    'medicina veterinária',
    'clínica médica de cães e gatos',
    'medicina felina',
    'cursos online veterinária',
  ],
  authors: [{ name: SITE_NAME }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/vethis-mark.png', shortcut: '/vethis-mark.png', apple: '/vethis-mark.png' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'pt_BR',
    url: SITE_URL,
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1920, height: 832, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
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
