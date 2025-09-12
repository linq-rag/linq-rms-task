/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    BACKEND_API_URL: process.env.BACKEND_API_URL || '',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  },
  images: {
    domains: [
      'ssl.gstatic.com',
      'drive-thirdparty.googleusercontent.com',
      'res.cdn.office.net',
      'static2.sharepointonline.com'
    ],
  },
}

module.exports = nextConfig