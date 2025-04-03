import { BookingStatus, RequestStatus } from '@prisma/client';
import { createBooking, findZoneByUniqueIdentifier } from '../data/bookings';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

// Helper function to generate a simple human-readable ID
function generateSimpleId(prefix: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `${prefix}${dateStr}-${randomPart}`;
}

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

        // Find the supplier organization to verify it exists and get its name
        const supplierOrg = await prisma.innOrganization.findUnique({
            where: {
                inn: supplierInn,
            },
        });

        if (!supplierOrg) {
            throw new Error(`Supplier with INN ${supplierInn} not found`);
        }

        // Generate a simple ID for the booking request
        const simpleId = generateSimpleId('BR');

        // For Category Managers, we'll use their own userId as the supplierId
        // since we might not have a User record for the supplier
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId, // Use our simple ID
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

            // Generate a simple ID for the booking
            const bookingSimpleId = generateSimpleId('B');

            // Pass supplier name to createBooking
            const booking = await createBooking(
                bookingRequest.id,
                zone.id,
                'KM_APPROVED' as BookingStatus,
                userId,
                supplierOrg.name, // Pass the supplier NAME instead of INN
                bookingSimpleId // Pass the simple ID
            );
            bookings.push(booking);

            // Update zone status and set the supplier name
            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: supplierOrg.name, // Use the supplier NAME instead of INN
                },
            });
        }
        return { bookingRequest, bookings };
    } else {
        // For non-CATEGORY_MANAGER users (suppliers)
        // The supplier is the current user, so we use their ID directly
        // Get the INN associated with the supplier representative user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { inn: true } // Select the INN field
        });

        if (!user?.inn) {
            throw new Error(`INN not found for user ${userId}. Cannot determine supplier.`);
        }

        // Find the supplier organization using the user's INN
        const supplierOrg = await prisma.innOrganization.findUnique({
            where: {
                inn: user.inn,
            },
        });

        if (!supplierOrg) {
            throw new Error(`Supplier organization not found for INN ${user.inn}`);
        }

        // Use the official name from the InnOrganization record
        const supplierName = supplierOrg.name;

        // Generate a simple ID for the booking request
        const simpleId = generateSimpleId('BR');

        // Create booking request with supplier's ID (the user making the request)
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId, // Use our simple ID
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

            // Generate a simple ID for the booking
            const bookingSimpleId = generateSimpleId('B');

            const booking = await createBooking(
                bookingRequest.id,
                zone.id,
                'PENDING_KM' as BookingStatus,
                userId,
                supplierName, // Use the supplier NAME
                bookingSimpleId // Pass the simple ID
            );
            bookings.push(booking);

            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: supplierName, // Use the supplier NAME
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
                orderBy: {
                    createdAt: 'desc', // Sort bookings from newest to oldest
                },
            },
            supplier: true,
            user: {
                select: {
                    inn: true,
                    supplierName: true,
                    name: true
                }
            },
        },
        orderBy: {
            createdAt: 'desc', // Sort booking requests from newest to oldest
        },
    });

    // Process booking requests to include supplier names
    const bookingRequestsWithSupplierNames = bookingRequests.map((bookingRequest) => {
        // The supplier name is now directly stored in the zone.supplier field
        const supplierName = bookingRequest.bookings.length > 0 ?
            bookingRequest.bookings[0].zone.supplier : null;

        if (supplierName) {
            return {
                ...bookingRequest,
                supplierName: supplierName,
            };
        }

        // Fallback: If zone.supplier is missing (shouldn't happen after creation fix),
        // try to get the official name from the user who created the request.
        // Avoid using user.name as the supplier name.
        if (bookingRequest.user?.supplierName) {
            return {
                ...bookingRequest,
                supplierName: bookingRequest.user.supplierName, // Use official name
            };
        } else {
            // If even the user's official name is missing, return N/A
            return {
                ...bookingRequest,
                supplierName: 'N/A', // Or 'Unknown Supplier'
            };
        }
    });

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
