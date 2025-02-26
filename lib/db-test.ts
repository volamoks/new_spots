import { prisma } from "./prisma";

/**
 * Проверяет подключение к базе данных
 * @returns Promise<boolean> - true, если подключение успешно, false в противном случае
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Выполняем простой запрос к базе данных
    await prisma.user.count();
    return true;
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
    return false;
  }
}

/**
 * Получает информацию о состоянии базы данных
 * @returns Promise<object> - объект с информацией о состоянии базы данных
 */
export async function getDatabaseInfo() {
  try {
    const userCount = await prisma.user.count();
    const zoneCount = await prisma.zone.count();
    const bookingCount = await prisma.booking.count();
    const requestCount = await prisma.bookingRequest.count();

    return {
      status: "connected",
      counts: {
        users: userCount,
        zones: zoneCount,
        bookings: bookingCount,
        requests: requestCount,
      },
      prismaVersion: process.env.npm_package_dependencies__prisma_client || "unknown",
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}