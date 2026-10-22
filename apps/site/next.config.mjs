/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Imagem de produção enxuta (server standalone) para o Dockerfile.
  output: 'standalone',
  // Pacotes do monorepo em TS: Next transpila diretamente do source.
  transpilePackages: [
    '@vethis/ui',
    '@vethis/api-client',
    '@vethis/design-tokens',
    '@vethis/shared',
  ],
  // Páginas estáticas autônomas (HTML pronto em /public) servidas em URL limpa.
  async rewrites() {
    return [
      // Plano de marketing (documento interno, noindex).
      { source: '/plano-mkt', destination: '/plano-mkt.html' },
      // Guia de gravação (noindex).
      { source: '/guia-gravacao', destination: '/guia-gravacao/index.html' },
    ];
  },
};

export default nextConfig;
