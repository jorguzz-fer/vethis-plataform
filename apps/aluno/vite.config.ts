import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// App do aluno — PWA instalável (base do Capacitor para iOS/Android).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vethis — Área do Aluno',
        short_name: 'Vethis',
        description: 'Seus cursos de educação médica veterinária.',
        theme_color: '#14523A',
        background_color: '#F7F6F2',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
  ],
});
