/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pacotes do monorepo em TS: Next transpila diretamente do source.
  transpilePackages: [
    '@vethis/ui',
    '@vethis/api-client',
    '@vethis/design-tokens',
    '@vethis/shared',
  ],
};

export default nextConfig;
