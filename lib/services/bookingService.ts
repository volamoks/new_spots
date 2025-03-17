import { BookingStatus, RequestStatus } from "@prisma/client";
import { createBooking, findZoneByUniqueIdentifier } from "../data/bookings";
import { prisma } from "../prisma";

/**
 * Создает новый запрос на бронирование с несколькими бронированиями зон
 * @param userId ID пользователя
 * @param zoneIds Массив идентификаторов зон
 * @param userRole Роль пользователя
 * @param userCategory Категория пользователя (опционально)
 * @param supplierInn ИНН поставщика (опционально)
 * @returns Запрос на бронирование со связанными бронированиями
 */
export async function createBookingRequest(
  userId: string,
  zoneIds: string[],
  userRole: string,
  userCategory?: string | null,
  supplierInn?: string | null
) {
  if (userRole === "CATEGORY_MANAGER") {
    if (!supplierInn) {
      throw new Error("Для бронирования необходимо выбрать поставщика");
    }

    const supplier = await prisma.user.findUnique({
      where: {
        inn: supplierInn,
      },
    });

    if (!supplier) {
      throw new Error(`Supplier with INN ${supplierInn} not found`);
    }

    const supplierId = supplier.id;

    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        userId,
        status: "NEW" as RequestStatus,
        category: userRole === "CATEGORY_MANAGER" ? userCategory : undefined,
        supplierId: supplierId,
      },
    });

    const bookings = [];
    for (const zoneId of zoneIds) {
      const zone = await findZoneByUniqueIdentifier(zoneId);

      if (!zone) {
        console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
        continue;
      }

      if (zone.status !== "AVAILABLE") {
        throw new Error(
          `Зона ${zone.uniqueIdentifier} недоступна для бронирования (текущий статус: ${zone.status})`
        );
      }

      const booking = await createBooking(
        bookingRequest.id,
        zone.id,
        "PENDING_KM" as BookingStatus
      );
      bookings.push(booking);

      await prisma.zone.update({
        where: { id: zone.id },
        data: {
          status: "BOOKED",
          supplier: supplierId,
        },
      });
    }
    return { bookingRequest, bookings };
  } else {
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        userId,
        status: "NEW" as RequestStatus,
        category: userRole === "CATEGORY_MANAGER" ? userCategory : undefined,
      },
    });

    const bookings = [];
    for (const zoneId of zoneIds) {
      const zone = await findZoneByUniqueIdentifier(zoneId);

      if (!zone) {
        console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
        continue;
      }

      if (zone.status !== "AVAILABLE") {
        throw new Error(
          `Зона ${zone.uniqueIdentifier} недоступна для бронирования (текущий статус: ${zone.status})`
        );
      }

      const booking = await createBooking(
        bookingRequest.id,
        zone.id,
        "PENDING_KM" as BookingStatus
      );
      bookings.push(booking);

      await prisma.zone.update({
        where: { id: zone.id },
        data: {
          status: "BOOKED",
          supplier: userId
        },
      });
    }
    return { bookingRequest, bookings };
  }
}

export async function getAllBookings(status?: string) {
  const where: any = {};

  if (status) {
    where.bookings = {
      some: {
        status: {
          in: status.split(',').map(s => s.trim())
        }
      }
    }
  }

  const bookingRequests = await prisma.bookingRequest.findMany({
    where,
    include: {
      bookings: {
        include: {
          zone: true,
          bookingRequest: true
        },
      },
      supplier: true,
      user: true,
    },
  });

  return bookingRequests;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus, role?: string) {
  if (role === 'CATEGORY_MANAGER') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });
  }
  else {
    // For other roles, update the individual booking status directly
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}
