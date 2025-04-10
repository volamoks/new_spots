import { BookingStatus, RequestStatus, Prisma } from '@prisma/client'; // Removed UserRole import
import { createBooking, findZoneByUniqueIdentifier } from '../data/bookings';
import { prisma } from '../prisma';
import getRedisClient from '@/lib/redis'; // Import Redis client getter
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
    console.log(`[Service] createBookingRequest called with userId: ${userId}, zoneIds: ${zoneIds.length}, userRole: ${userRole}, userCategory: ${userCategory}, supplierInn: ${supplierInn}, brandId: ${brandId}`);

    // --- Mandatory Brand Check ---
    if (!brandId) {
        throw new Error('Для бронирования необходимо выбрать бренд');
    }
    if (userRole === 'CATEGORY_MANAGER') {
        if (!supplierInn) {
            throw new Error('Для бронирования необходимо выбрать поставщика');
        }
        // Find the Organization name directly using the selected INN
        // No need to check for a registered User based on new requirements
        // We still need the org name later, let's get it too (or assume it exists if user exists)
        const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: supplierInn }, select: { name: true } });
        if (!supplierOrg) { throw new Error(`Supplier organization details not found for INN ${supplierInn}`); }
        const simpleId = generateSimpleId('BR');
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId,
                userId,
                status: 'NEW' as RequestStatus,
                category: userCategory,
                supplierId: null, // KM books for an org, not necessarily a registered user
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
            // --- Cache Invalidation ---
            try {
                const redisClient = getRedisClient();
                const keys = await redisClient.keys('zones:*');
                if (keys.length > 0) {
                    await redisClient.del(keys);
                    console.log(`[Service] Invalidated ${keys.length} zone cache keys after booking zone ${zone.id} (KM).`);
                }
            } catch (redisError) {
                console.error(`[Service] Redis cache invalidation error after booking zone ${zone.id} (KM):`, redisError);
            }
            // --- End Cache Invalidation ---
        }
        return { bookingRequest, bookings };
    } else if (userRole === 'SUPPLIER') {
        // --- Supplier Role Logic ---
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { inn: true, category: true } }); // Also fetch category if needed
        if (!user?.inn) { throw new Error(`ИНН не найден для пользователя ${userId}`); }

        // Use the supplier's own category if not provided explicitly (or decide priority)
        const effectiveCategory = userCategory || user.category; // Use provided category, fallback to user's profile category

        const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: user.inn } });
        if (!supplierOrg) { throw new Error(`Организация поставщика не найдена для ИНН ${user.inn}`); }
        const supplierName = supplierOrg.name;
        const simpleId = generateSimpleId('BR');
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                id: simpleId,
                userId,
                status: 'NEW' as RequestStatus,
                category: effectiveCategory, // Use the determined category
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
            // --- Cache Invalidation ---
            try {
                const redisClient = getRedisClient();
                const keys = await redisClient.keys('zones:*');
                if (keys.length > 0) {
                    await redisClient.del(keys);
                    console.log(`[Service] Invalidated ${keys.length} zone cache keys after booking zone ${zone.id} (Supplier).`);
                }
            } catch (redisError) {
                console.error(`[Service] Redis cache invalidation error after booking zone ${zone.id} (Supplier):`, redisError);
            }
            // --- End Cache Invalidation ---
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
    pagination?: { page: number; pageSize: number }; // Make pagination optional
    user: { id: string; role: string; inn?: string | null; category?: string | null }; // Add category to user type
}): Promise<{ data: BookingRequestWithBookings[]; totalCount: number }> { // Use specific return type

    const { filters, pagination, user } = options;
    // Default pagination if not provided (for export case)
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize; // Will be undefined if pagination is not provided

    // Initialize the main 'where' clause with an AND array
    const where: Prisma.BookingRequestWhereInput = { AND: [] };
    // Keep this for collecting conditions related to bookings/zones
    const bookingWhereConditions: Prisma.BookingWhereInput[] = [];

    // --- Role-based Filtering ---
    if (user.role === 'SUPPLIER') { // Compare with string literal
        // Suppliers see requests assigned to them
        (where.AND as Prisma.BookingRequestWhereInput[]).push({ supplierId: user.id });
    } else if (user.role === 'CATEGORY_MANAGER') { // Compare with string literal
        // --- KM Category Filter ---
        // KMs should only see requests matching their assigned category
        // --- KM Category Filter ---
        if (user.category) {
            // Add category filter to the main AND clause
            const categoryFilter = { category: user.category };
            (where.AND as Prisma.BookingRequestWhereInput[]).push(categoryFilter);
            console.log(`[Service - getAllBookings] Applied KM category filter:`, JSON.stringify(categoryFilter)); // Log applied filter as string
        } else {
            // If KM has no category assigned, add an impossible condition to the main AND clause
            console.warn(`[Service - getAllBookings] Category Manager ${user.id} has no category assigned. Filtering out all requests.`);
            // If KM has no category assigned, add an impossible condition to the main AND clause
            // If KM has no category assigned, add an impossible condition to the main AND clause
            const impossibleFilter = { id: '-1' };
            (where.AND as Prisma.BookingRequestWhereInput[]).push(impossibleFilter);
            console.warn(`[Service - getAllBookings] Category Manager ${user.id} has no category assigned. Applied impossible filter:`, JSON.stringify(impossibleFilter)); // Log impossible filter
        }

        // --- KM Supplier Filter (Existing Logic) ---
        // Category Managers see requests relevant to their suppliers/category?
        // Filter by supplierInn or supplierIds if provided
        if (filters.supplierInn) {
            const supplierOrg = await prisma.innOrganization.findUnique({ where: { inn: filters.supplierInn }, select: { name: true } });
            if (supplierOrg?.name) {
                // Find requests where at least one booking's zone has this supplier name
                bookingWhereConditions.push({ zone: { supplier: supplierOrg.name } });
            } else {
                // If INN doesn't match, return no results for this filter
                // Add impossible condition to the main AND clause if supplier not found
                (where.AND as Prisma.BookingRequestWhereInput[]).push({ id: '-1' });
            }
        } else if (filters.supplierIds && filters.supplierIds.length > 0) {
            // Find requests where at least one booking's zone has a supplier name from the list
            const supplierOrgs = await prisma.innOrganization.findMany({ where: { inn: { in: filters.supplierIds } }, select: { name: true } });
            const supplierNames = supplierOrgs.map(org => org.name);
            if (supplierNames.length > 0) {
                bookingWhereConditions.push({ zone: { supplier: { in: supplierNames } } });
            } else {
                // If INNs don't match any orgs, return no results for this filter
                // Add impossible condition to the main AND clause if suppliers not found
                (where.AND as Prisma.BookingRequestWhereInput[]).push({ id: '-1' });
            }
        }
        // If neither supplierInn nor supplierIds is provided, CM sees all requests (no additional where clause here)
    }
    // Add other role logic if necessary (e.g., DMP_MANAGER)

    // --- Filter out empty requests (requests with no bookings) ---
    (where.AND as Prisma.BookingRequestWhereInput[]).push({
        bookings: {
            some: {} // Ensures there is at least one booking linked
        }
    });

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
        // Add date conditions to the main AND clause
        (where.AND as Prisma.BookingRequestWhereInput[]).push({ createdAt: dateConditions });
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
    // If there are conditions related to bookings/zones, add them to the main AND clause
    if (bookingWhereConditions.length > 0) {
        (where.AND as Prisma.BookingRequestWhereInput[]).push({
            bookings: {
                some: {
                    AND: bookingWhereConditions
                }
            }
        });
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
        // Add the search term conditions to the main AND clause
        (where.AND as Prisma.BookingRequestWhereInput[]).push(termConditions);
    }


    // --- Pagination ---
    // Only apply skip/take if pageSize is provided
    const skip = pageSize ? (page - 1) * pageSize : undefined;
    const take = pageSize;

    // --- Database Query ---
    // Clean up the where clause if AND is empty
    // Clean up the where clause if AND is empty or only contains empty objects
    const cleanedAND = (where.AND as Prisma.BookingRequestWhereInput[]).filter(cond => Object.keys(cond).length > 0);
    const finalWhere = cleanedAND.length > 0 ? { AND: cleanedAND } : {};
    // Log the final clause *before* the query
    console.log("[Service - getAllBookings] FINAL Prisma Where Clause before query:", JSON.stringify(finalWhere, null, 2));

    const [totalCount, bookingRequests] = await prisma.$transaction([
        prisma.bookingRequest.count({ where: finalWhere }),
        prisma.bookingRequest.findMany({
            where: finalWhere,
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

    console.log(`[Service - getAllBookings] Found ${totalCount} total requests. Pagination: ${pagination ? `page ${page}, size ${pageSize}` : 'ALL'}. Returning ${bookingRequests.length} requests.`);

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
