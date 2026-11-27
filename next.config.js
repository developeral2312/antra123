/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pdfkit']
  },
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
