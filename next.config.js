const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Отключаем проверки во время сборки
  eslint: {
    ignoreDuringBuilds: true, // Игнорировать ошибки ESLint во время сборки
  },
  typescript: {
    ignoreBuildErrors: true, // Игнорировать ошибки TypeScript во время сборки
  },
  // Отключаем строгую проверку для динамических маршрутов
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  // Отключаем проверку на динамическое использование сервера
  onDemandEntries: {
    // Период времени в мс, в течение которого страница должна оставаться в буфере
    maxInactiveAge: 25 * 1000,
    // Количество страниц, которые должны оставаться в буфере
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig

