const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig

