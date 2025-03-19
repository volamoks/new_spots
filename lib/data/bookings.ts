import { prisma } from "../prisma";
import { Prisma, BookingStatus, RequestStatus } from "@prisma/client";

/**
 * Получает запросы на бронирование по указанным фильтрам
 * @param whereClause Условия фильтрации
 * @returns Список запросов на бронирование
 */
export async function getBookingRequests(whereClause: Prisma.BookingRequestWhereInput) {
  return prisma.bookingRequest.findMany({
    where: whereClause,
    include: {
      bookings: {
        include: {
          zone: true,
        },
      },
      user: {
        select: {
          inn: true, // Select the inn field
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Получает запрос на бронирование по ID
 * @param id ID запроса
 * @returns Запрос на бронирование с включенными бронированиями и зонами
 */
export async function getBookingRequestById(id: string) {
  return prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          zone: true,
        },
      },
      user: true,
      supplier: {
        select: {
          id: true,
          name: true,
          supplierName: true
        }
      }
    },
  });
}

/**
 * Создает бронирование для указанной зоны
 * @param bookingRequestId ID запроса на бронирование
 * @param zoneId ID зоны
 * @param status Статус бронирования
 * @param userId ID пользователя
 * @param supplierName Имя поставщика (опционально)
 * @param bookingId Простой ID для бронирования (опционально)
 * @returns Созданное бронирование
 */
export async function createBooking(
  bookingRequestId: string,
  zoneId: string,
  status: BookingStatus,
  userId: string,
  supplierName?: string,
  bookingId?: string,
) {
  const booking = await prisma.booking.create({
    data: {
      id: bookingId, // Use the provided simple ID if available
      bookingRequestId,
      zoneId,
      status,
    },
  });

  // Update the zone's supplier if supplierName is provided
  if (supplierName) {
    await prisma.zone.update({
      where: { id: zoneId },
      data: { supplier: supplierName },
    });
  }

  return booking;
}

/**
 * Обновляет статус бронирования
 * @param bookingId ID бронирования
 * @param status Новый статус
 * @returns Обновленное бронирование
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
}

/**
 * Обновляет статус запроса на бронирование
 * @param requestId ID запроса
 * @param status Новый статус
 * @returns Обновленный запрос
 */
export async function updateBookingRequestStatus(requestId: string, status: RequestStatus) {
  return prisma.bookingRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

/**
 * Находит зону по уникальному идентификатору
 * @param uniqueIdentifier Уникальный идентификатор зоны
 * @returns Найденная зона или null
 */
export async function findZoneByUniqueIdentifier(uniqueIdentifier: string) {
  return prisma.zone.findUnique({
    where: { uniqueIdentifier },
  });
}
