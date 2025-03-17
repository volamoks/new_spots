import { BookingStatus, RequestStatus } from '@prisma/client';
import { createBooking, findZoneByUniqueIdentifier } from '../data/bookings';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

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
    supplierInn?: string | null,
) {
    if (userRole === 'CATEGORY_MANAGER') {
        if (!supplierInn) {
            throw new Error('Для бронирования необходимо выбрать поставщика');
        }

        const supplier = await prisma.innOrganization.findUnique({
            where: {
                inn: supplierInn,
            },
        });

        if (!supplier) {
            throw new Error(`Supplier with INN ${supplierInn} not found`);
        }

        // Use the KM's userId for the booking request
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                userId,
                status: 'NEW' as RequestStatus,
                category: userCategory, // Always defined for CATEGORY_MANAGER
                supplierId: null, // No longer setting supplierId on the request
            },
        });

        const bookings = [];
        for (const zoneId of zoneIds) {
            const zone = await findZoneByUniqueIdentifier(zoneId);

            if (!zone) {
                console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
                continue;
            }

            if (zone.status !== 'AVAILABLE') {
                throw new Error(
                    `Зона ${zone.uniqueIdentifier} недоступна для бронирования (текущий статус: ${zone.status})`,
                );
            }

            // Pass supplierId to createBooking
            const booking = await createBooking(
                bookingRequest.id,
                zone.id,
                'KM_APPROVED' as BookingStatus,
                userId,
            );
            bookings.push(booking);
        }
        return { bookingRequest, bookings };
    } else {
        // For non-CATEGORY_MANAGER users, keep the existing logic
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                userId,
                status: 'NEW' as RequestStatus,
                category: userRole === 'CATEGORY_MANAGER' ? userCategory : undefined,
            },
        });

        const bookings = [];
        for (const zoneId of zoneIds) {
            const zone = await findZoneByUniqueIdentifier(zoneId);

            if (!zone) {
                console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
                continue;
            }

            if (zone.status !== 'AVAILABLE') {
                throw new Error(
                    `Зона ${zone.uniqueIdentifier} недоступна для бронирования (текущий статус: ${zone.status})`,
                );
            }

            const booking = await createBooking(
                bookingRequest.id,
                zone.id,
                'PENDING_KM' as BookingStatus,
                userId,
            );
            bookings.push(booking);

            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: userId,
                },
            });
        }
        return { bookingRequest, bookings };
    }
}

export async function getAllBookings(status?: string) {
    const where: Prisma.BookingRequestWhereInput = {};

    if (status) {
        const statuses = status.split(',').map((s) => s.trim()) as BookingStatus[];
        where.bookings = {
            some: {
                status: {
                    in: statuses,
                },
            },
        };
    }

    const bookingRequests = await prisma.bookingRequest.findMany({
        where,
        include: {
            bookings: {
                include: {
                    zone: true,
                    bookingRequest: true,
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
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error(`Booking with ID ${bookingId} not found`);
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status },
        });
    } else {
        // For other roles, update the individual booking status directly
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status },
        });
    }
}
