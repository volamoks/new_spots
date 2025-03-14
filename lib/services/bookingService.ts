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
 * @param supplierId ID поставщика (опционально)
 * @returns Запрос на бронирование со связанными бронированиями
 */
export async function createBookingRequest(
  userId: string,
  zoneIds: string[],
  userRole: string,
  userCategory?: string | null,
  supplierId?: string | null
) {
  // Для категорийного менеджера проверяем, что указан поставщик
  if (userRole === "CATEGORY_MANAGER") {
    // Проверяем, что указан поставщик
    if (!supplierId) {
      throw new Error("Для бронирования необходимо выбрать поставщика");
    }
    
    // Убрана проверка на соответствие категории зон категории менеджера
    // Категорийный менеджер может бронировать любые доступные зоны от имени поставщика
  }

  // Создаем запрос на бронирование
  const bookingRequest = await prisma.bookingRequest.create({
    data: {
      userId,
      status: "NEW" as RequestStatus,
      category: userRole === "CATEGORY_MANAGER" ? userCategory : undefined,
      supplierId: supplierId || undefined,
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

    // Проверяем доступность зоны
    if (zone.status !== "AVAILABLE") {
      throw new Error(`Зона ${zone.uniqueIdentifier} недоступна для бронирования (текущий статус: ${zone.status})`);
    }

    const booking = await createBooking(
      bookingRequest.id,
      zone.id,
      "PENDING_KM" as BookingStatus
    );
    bookings.push(booking);
    
    // Обновляем статус зоны на BOOKED и устанавливаем поставщика
    await prisma.zone.update({
      where: { id: zone.id },
      data: { 
        status: "BOOKED",
        supplier: supplierId || undefined
      },
    });
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
