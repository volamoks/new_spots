import { BookingStatus, RequestStatus } from "@prisma/client";
import { getBookingRequests, createBooking, findZoneByUniqueIdentifier } from "../data/bookings";
import { buildBookingFilters } from "../utils/filters";
import { prisma } from "../prisma";

/**
 * Создает новый запрос на бронирование с несколькими бронированиями зон
 * @param userId ID пользователя
 * @param zoneIds Массив идентификаторов зон
 * @param userRole Роль пользователя
 * @param userCategory Категория пользователя (опционально)
 * @returns Запрос на бронирование со связанными бронированиями
 */
export async function createBookingRequest(
  userId: string,
  zoneIds: string[],
  userRole: string,
  userCategory?: string
) {
  // Создаем запрос на бронирование
  const bookingRequest = await prisma.bookingRequest.create({
    data: {
      userId,
      status: "NEW" as RequestStatus,
      category: userRole === "CATEGORY_MANAGER" ? userCategory : undefined,
    },
  });

  // Создаем бронирования для каждой зоны
  const bookings = [];
  for (const zoneId of zoneIds) {
    const zone = await findZoneByUniqueIdentifier(zoneId);

    if (!zone) {
      console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
      continue;
    }

    const booking = await createBooking(
      bookingRequest.id,
      zone.id,
      "PENDING_KM" as BookingStatus
    );
    bookings.push(booking);
  }

  return { bookingRequest, bookings };
}

/**
 * Получает запросы на бронирование в зависимости от роли пользователя и параметров фильтрации
 * @param userId ID пользователя
 * @param userRole Роль пользователя
 * @param userCategory Категория пользователя (опционально)
 * @param requestId ID запроса (опционально)
 * @param status Статус запроса (опционально)
 * @returns Список запросов на бронирование
 */
export async function fetchBookingRequests(
  userId: string,
  userRole: string,
  userCategory?: string | null,
  requestId?: string | null,
  status?: string | null
) {
  // Построение фильтров на основе роли пользователя и параметров
  const whereClause = buildBookingFilters(
    userRole,
    userId,
    requestId,
    status,
    userCategory
  );

  // Получение запросов на бронирование с использованием слоя доступа к данным
  const bookingRequests = await getBookingRequests(whereClause);

  return bookingRequests;
}