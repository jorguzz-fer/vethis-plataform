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
  // Plano de marketing (documento interno, noindex) servido como HTML estático de /public.
  async rewrites() {
    return [
      { source: '/plano-mkt', destination: '/plano-mkt.html' },
      { source: '/guia-gravacao', destination: '/guia-gravacao.html' },
    ];
  },
};

export default nextConfig;
