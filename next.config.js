/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'pdfkit']
  },
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
