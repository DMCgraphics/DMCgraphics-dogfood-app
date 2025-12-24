/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/about-us',
        destination: '/about',
        permanent: true, // 301 redirect for SEO
      },
    ]
  },
}

export default nextConfig
