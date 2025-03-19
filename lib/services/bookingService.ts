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

        // Find the supplier organization to verify it exists
        const supplierOrg = await prisma.innOrganization.findUnique({
            where: {
                inn: supplierInn,
            },
        });

        if (!supplierOrg) {
            throw new Error(`Supplier with INN ${supplierInn} not found`);
        }

        // For Category Managers, we'll use their own userId as the supplierId
        // since we might not have a User record for the supplier
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                userId,
                status: 'NEW' as RequestStatus,
                category: userCategory, // Always defined for CATEGORY_MANAGER
                supplierId: userId, // Use the Category Manager's ID
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

            // Pass supplierInn to createBooking
            const booking = await createBooking(
                bookingRequest.id,
                zone.id,
                'KM_APPROVED' as BookingStatus,
                userId,
                supplierInn, // Pass the supplier INN to associate with the booking
            );
            bookings.push(booking);

            // Update zone status and set the supplier
            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: supplierInn, // Use the supplier INN
                },
            });
        }
        return { bookingRequest, bookings };
    } else {
        // For non-CATEGORY_MANAGER users (suppliers)
        // The supplier is the current user, so we use their ID directly

        // Create booking request with supplier's ID
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                userId,
                status: 'NEW' as RequestStatus,
                category: userRole === 'CATEGORY_MANAGER' ? userCategory : undefined,
                supplierId: userId, // For suppliers, they are both the user and the supplier
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
                userId, // For suppliers, use their ID
            );
            bookings.push(booking);

            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: userId, // For suppliers, use their ID
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
            user: {
                select: {
                    inn: true,
                }
            },
        },
    });

    // Fetch supplier names from InnOrganization table
    const bookingRequestsWithSupplierNames = await Promise.all(
        bookingRequests.map(async (bookingRequest) => {
            // Check if any of the bookings have a supplier INN in the zone
            const supplierInn = bookingRequest.bookings.length > 0 ?
                bookingRequest.bookings[0].zone.supplier : null;

            if (supplierInn) {
                // Try to find the supplier organization by INN
                const supplier = await prisma.innOrganization.findUnique({
                    where: {
                        inn: supplierInn,
                    },
                });
                if (supplier) {
                    return {
                        ...bookingRequest,
                        supplierName: supplier.name,
                    };
                }
            }

            // Fallback to the user's inn if zone supplier is not available
            if (bookingRequest.user?.inn) {
                const supplier = await prisma.innOrganization.findUnique({
                    where: {
                        inn: bookingRequest.user.inn,
                    },
                });
                return {
                    ...bookingRequest,
                    supplierName: supplier?.name || 'N/A',
                };
            } else {
                return {
                    ...bookingRequest,
                    supplierName: 'N/A',
                };
            }
        })
    );

    return bookingRequestsWithSupplierNames;
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
