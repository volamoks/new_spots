import { BookingStatus, RequestStatus, Prisma } from '@prisma/client'; // Removed UserRole import
import { createBooking, findZoneByUniqueIdentifier } from '../data/bookings';
import { prisma } from '../prisma';
// Import types from the store
import type { BookingRequestFilters, BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';

// Removed diagnostic log for UserRole
// Helper function to generate a simple human-readable ID (keep as is)
function generateSimpleId(prefix: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `${prefix}${dateStr}-${randomPart}`;
}

// createBookingRequest function remains the same for now...
export async function createBookingRequest(
    userId: string,
    zoneIds: string[],
    userRole: string, // Use string type for role comparison
    userCategory?: string | null,
    supplierInn?: string | null,
    brandId?: string | null,
) {
    // ... (existing implementation)
    console.log(`[Service] createBookingRequest called with userId: ${userId}, zoneIds: ${zoneIds.length}, userRole: ${userRole}, supplierInn: ${supplierInn}, brandId: ${brandId}`);
    if (userRole === 'CATEGORY_MANAGER') {
        if (!supplierInn) {
            throw new Error('Для бронирования необходимо выбрать поставщика');
        }
        const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: supplierInn } });
        if (!supplierOrg) { throw new Error(`Supplier with INN ${supplierInn} not found`); }
        const simpleId = generateSimpleId('BR');
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId,
                userId,
                status: 'NEW' as RequestStatus,
                category: userCategory,
                supplierId: userId, // Using CM's ID as placeholder? Revisit if needed.
            },
        });
        const bookings = [];
        for (const zoneId of zoneIds) {
            const zone = await findZoneByUniqueIdentifier(zoneId);
            if (!zone) { console.warn(`Zone ${zoneId} not found, skipping`); continue; }
            if (zone.status !== 'AVAILABLE') { throw new Error(`Зона ${zone.uniqueIdentifier} недоступна: ${zone.status}`); }
            const bookingSimpleId = generateSimpleId('B');
            const booking = await createBooking(bookingRequest.id, zone.id, 'KM_APPROVED' as BookingStatus, userId, supplierOrg.name, bookingSimpleId, brandId);
            console.log(`[Service] Called createBooking for zone ${zone.id} with brandId: ${brandId}`);
            bookings.push(booking);
            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: supplierOrg.name,
                    brand: brandId ? (await prisma.brand.findUnique({ where: { id: brandId } }))?.name : null,
                },
            });
        }
        return { bookingRequest, bookings };
    } else { // Supplier role
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { inn: true } });
        if (!user?.inn) { throw new Error(`INN not found for user ${userId}`); }
        const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: user.inn } });
        if (!supplierOrg) { throw new Error(`Supplier organization not found for INN ${user.inn}`); }
        const supplierName = supplierOrg.name;
        const simpleId = generateSimpleId('BR');
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId,
                userId,
                status: 'NEW' as RequestStatus,
                category: undefined, // Suppliers don't have category on request
                supplierId: userId, // Supplier user is the supplier
            },
        });
        const bookings = [];
        for (const zoneId of zoneIds) {
            const zone = await findZoneByUniqueIdentifier(zoneId);
            if (!zone) { console.warn(`Zone ${zoneId} not found, skipping`); continue; }
            if (zone.status !== 'AVAILABLE') { throw new Error(`Зона ${zone.uniqueIdentifier} недоступна: ${zone.status}`); }
            const bookingSimpleId = generateSimpleId('B');
            const booking = await createBooking(bookingRequest.id, zone.id, 'PENDING_KM' as BookingStatus, userId, supplierName, bookingSimpleId, brandId);
            console.log(`[Service] Called createBooking for zone ${zone.id} with brandId: ${brandId}`);
            bookings.push(booking);
            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    status: 'BOOKED',
                    supplier: supplierName,
                    brand: brandId ? (await prisma.brand.findUnique({ where: { id: brandId } }))?.name : null,
                },
            });
        }
        return { bookingRequest, bookings };
    }
}


/**
 * Fetches booking requests with filtering and pagination.
 * @param options - Object containing filters, pagination, and user info.
 * @returns Object with paginated data and total count.
 */
export async function getAllBookings(options: {
    filters: Partial<BookingRequestFilters>; // Use Partial as not all filters might be set
    pagination: { page: number; pageSize: number };
    user: { id: string; role: string; inn?: string | null }; // Use string type for role comparison
}): Promise<{ data: BookingRequestWithBookings[]; totalCount: number }> { // Use specific return type

    const { filters, pagination, user } = options;
    const { page, pageSize } = pagination;

    const where: Prisma.BookingRequestWhereInput = {};
    const bookingWhereConditions: Prisma.BookingWhereInput[] = []; // Collect conditions for bookings

    // --- Role-based Filtering ---
    if (user.role === 'SUPPLIER') { // Compare with string literal
        // Suppliers see requests they created
        where.userId = user.id;
    } else if (user.role === 'CATEGORY_MANAGER') { // Compare with string literal
        // Category Managers see requests relevant to their suppliers/category?
        // Filter by supplierInn or supplierIds if provided
        if (filters.supplierInn) {
            const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: filters.supplierInn }, select: { name: true } });
            if (supplierOrg?.name) {
                // Find requests where at least one booking's zone has this supplier name
                bookingWhereConditions.push({ zone: { supplier: supplierOrg.name } });
            } else {
                // If INN doesn't match, return no results for this filter
                where.id = '-1'; // Impossible condition to return no results
            }
        } else if (filters.supplierIds && filters.supplierIds.length > 0) {
            // Find requests where at least one booking's zone has a supplier name from the list
            const supplierOrgs = await prisma.innOrganization.findMany({ where: { inn: { in: filters.supplierIds } }, select: { name: true } });
            const supplierNames = supplierOrgs.map(org => org.name);
            if (supplierNames.length > 0) {
                bookingWhereConditions.push({ zone: { supplier: { in: supplierNames } } });
            } else {
                // If INNs don't match any orgs, return no results for this filter
                where.id = '-1'; // Impossible condition
            }
        }
        // If neither supplierInn nor supplierIds is provided, CM sees all requests (no additional where clause here)
    }
    // Add other role logic if necessary (e.g., DMP_MANAGER)

    // --- Apply Filters ---

    // Status filter
    if (filters.status && filters.status.length > 0) {
        // Ensure statuses are valid BookingStatus enum values if needed
        bookingWhereConditions.push({ status: { in: filters.status } });
    }

    // Supplier Name filter (searches the name stored on the zone)
    if (filters.supplierName && filters.supplierName.trim() !== '') {
        bookingWhereConditions.push({ zone: { supplier: { contains: filters.supplierName, mode: 'insensitive' } } });
    }

    // Date range filter (on BookingRequest createdAt)
    const dateConditions: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) {
        try {
            dateConditions.gte = new Date(filters.dateFrom);
        } catch { console.error("Invalid dateFrom format:", filters.dateFrom); } // Omit unused error variable
    }
    if (filters.dateTo) {
        try {
            // Set to end of day
            const endDate = new Date(filters.dateTo);
            endDate.setHours(23, 59, 59, 999);
            dateConditions.lte = endDate;
        } catch { console.error("Invalid dateTo format:", filters.dateTo); } // Omit unused error variable
    }
    if (Object.keys(dateConditions).length > 0) {
        where.createdAt = dateConditions;
    }

    // Zone attribute filters
    const zoneWhere: Prisma.ZoneWhereInput = {};
    if (filters.city && filters.city.length > 0) {
        zoneWhere.city = { in: filters.city };
    }
    if (filters.market && filters.market.length > 0) {
        zoneWhere.market = { in: filters.market };
    }
    if (filters.macrozone && filters.macrozone.length > 0) {
        zoneWhere.mainMacrozone = { in: filters.macrozone }; // Assuming field name is mainMacrozone
    }
    if (filters.equipment && filters.equipment.length > 0) {
        zoneWhere.equipment = { in: filters.equipment };
    }
    if (Object.keys(zoneWhere).length > 0) {
        bookingWhereConditions.push({ zone: zoneWhere });
    }

    // Combine booking conditions if any exist
    if (bookingWhereConditions.length > 0) {
        where.bookings = {
            some: {
                AND: bookingWhereConditions // Use AND to ensure all booking conditions match within the same booking(s)
            }
        };
    }

    // General Search Term filter
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.trim();
        // Prisma's default search is case-insensitive on PostgreSQL, adjust 'mode' if needed for other DBs
        const searchMode = Prisma.QueryMode.insensitive;

        const termConditions: Prisma.BookingRequestWhereInput = {
            OR: [
                // Search on BookingRequest fields
                { id: { contains: term, mode: searchMode } }, // Search by simple ID
                { user: { name: { contains: term, mode: searchMode } } },
                { user: { email: { contains: term, mode: searchMode } } },
                // Search on Booking/Zone fields (requires 'some' condition)
                {
                    bookings: {
                        some: {
                            OR: [
                                { zone: { uniqueIdentifier: { contains: term, mode: searchMode } } },
                                { zone: { city: { contains: term, mode: searchMode } } },
                                { zone: { market: { contains: term, mode: searchMode } } },
                                { zone: { mainMacrozone: { contains: term, mode: searchMode } } },
                                { zone: { equipment: { contains: term, mode: searchMode } } },
                                { zone: { supplier: { contains: term, mode: searchMode } } }, // Search supplier name on zone
                                { brand: { name: { contains: term, mode: searchMode } } } // Search brand name
                            ]
                        }
                    }
                }
            ]
        };

        // Combine with existing where clause using AND
        if (where.OR) {
            // If OR already exists (unlikely here, but for safety), merge conditions
            where.AND = [...(Array.isArray(where.AND) ? where.AND : []), termConditions];
        } else if (where.AND) {
            // If AND already exists, add the OR block to it
            where.AND = [...(Array.isArray(where.AND) ? where.AND : []), termConditions];
        } else {
            // Otherwise, just add the OR block
            where.AND = [termConditions]; // Wrap in AND to combine with other top-level conditions
        }
    }


    // --- Pagination ---
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // --- Database Query ---
    console.log("[Service - getAllBookings] Prisma Where Clause:", JSON.stringify(where, null, 2)); // Log the final where clause

    const [totalCount, bookingRequests] = await prisma.$transaction([
        prisma.bookingRequest.count({ where }),
        prisma.bookingRequest.findMany({
            where,
            include: {
                bookings: {
                    include: {
                        zone: true,
                        bookingRequest: true, // Explicitly include nested bookingRequest
                        brand: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                supplier: true, // Keep supplier relation if needed elsewhere, though name comes from zone
                user: true, // Select the full user object to match BookingRequestWithBookings type
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
    ]);

    console.log(`[Service - getAllBookings] Found ${totalCount} total requests, returning ${bookingRequests.length} for page ${page}`);

    // --- Process Results (Add supplierName fallback if necessary) ---
    // This logic might be simplified if zone.supplier is always reliable
    const processedData = bookingRequests.map((req) => {
        // Prioritize supplier name from the first booking's zone
        const zoneSupplierName = req.bookings.length > 0 ? req.bookings[0].zone?.supplier : null;
        // Fallback to user's official supplier name if zone name is missing
        const userSupplierName = req.user?.supplierName;

        return {
            ...req,
            // Ensure supplierName field exists for consistency with the store type
            supplierName: zoneSupplierName || userSupplierName || 'N/A',
        };
    });


    return { data: processedData, totalCount };
}


// updateBookingStatus function remains the same
export async function updateBookingStatus(bookingId: string, status: BookingStatus, role?: string) {
    // ... (existing implementation)
    const userRole = role as string | undefined; // Use string type
    if (userRole === 'CATEGORY_MANAGER') { // Compare with string literal
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) { throw new Error(`Booking with ID ${bookingId} not found`); }
        await prisma.booking.update({ where: { id: bookingId }, data: { status } });
    } else {
        // Allow other roles (like SUPPLIER) to update status directly?
        // Add specific role checks if needed
        await prisma.booking.update({ where: { id: bookingId }, data: { status } });
    }
}
