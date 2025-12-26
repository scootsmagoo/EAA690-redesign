/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Ensure /login stays on our site and doesn't redirect to Squarespace
      // This overrides any Vercel-level redirects
    ]
  },
}

module.exports = nextConfig

