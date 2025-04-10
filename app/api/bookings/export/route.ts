import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Import the options object
import { getAllBookings } from '@/lib/services/bookingService';
import { generateBookingsExcelBuffer, type BookingExportData } from '@/lib/utils/excel-export';
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';
import { BookingStatus } from '@prisma/client'; // Import BookingStatus enum

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions); // Use getServerSession
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { user } = session;
        // Ensure user object has necessary fields (adjust based on your actual session structure)
        const serviceUser = {
            id: user.id,
            role: user.role,
            inn: user.inn,
            category: user.category,
        };

        const { searchParams } = request.nextUrl;

        // --- Parse Filters ---
        const filters: Partial<BookingRequestFilters> = {};

        // Status (can be multiple)
        const statusParam = searchParams.getAll('status'); // Use getAll for potential multiple values
        if (statusParam.length > 0) {
            // Validate against BookingStatus enum if necessary
            filters.status = statusParam.filter(s => s in BookingStatus) as BookingStatus[];
        }

        // Supplier Name (string search)
        const supplierName = searchParams.get('supplierName');
        if (supplierName) filters.supplierName = supplierName;

        // Supplier INN (specific match, usually for KM)
        const supplierInn = searchParams.get('supplierInn');
        if (supplierInn) filters.supplierInn = supplierInn;

        // Date Range
        const dateFrom = searchParams.get('dateFrom');
        if (dateFrom) filters.dateFrom = dateFrom;
        const dateTo = searchParams.get('dateTo');
        if (dateTo) filters.dateTo = dateTo;

        // Zone Attributes (can be multiple)
        const city = searchParams.getAll('city');
        if (city.length > 0) filters.city = city;
        const market = searchParams.getAll('market');
        if (market.length > 0) filters.market = market;
        const macrozone = searchParams.getAll('macrozone');
        if (macrozone.length > 0) filters.macrozone = macrozone;
        const equipment = searchParams.getAll('equipment');
        if (equipment.length > 0) filters.equipment = equipment;

        // General Search Term
        const searchTerm = searchParams.get('searchTerm');
        if (searchTerm) filters.searchTerm = searchTerm;

        console.log('[API Export] Parsed Filters:', filters);
        console.log('[API Export] User:', serviceUser);

        // --- Fetch Data (No Pagination) ---
        const { data: bookingRequests, totalCount } = await getAllBookings({
            filters,
            user: serviceUser,
            // No pagination parameter passed, so it fetches all
        });

        console.log(`[API Export] Fetched ${totalCount} booking requests matching filters.`);

        // --- Flatten Data for Excel ---
        const flatBookings: BookingExportData[] = bookingRequests.flatMap(req =>
            req.bookings.map(booking => ({
                id: booking.id,
                bookingRequestId: req.id, // Use request ID
                status: booking.status,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                zone: booking.zone ? { // Map zone details
                    id: booking.zone.id,
                    uniqueIdentifier: booking.zone.uniqueIdentifier,
                    city: booking.zone.city,
                    market: booking.zone.market,
                    supplier: booking.zone.supplier, // Supplier from zone
                    brand: booking.zone.brand // Brand from zone
                } : null,
                bookingRequest: { // Map relevant request details
                    category: req.category,
                    user: req.user ? {
                        name: req.user.name,
                        email: req.user.email,
                        role: req.user.role
                    } : null
                }
            }))
        );

        console.log(`[API Export] Flattened ${flatBookings.length} bookings for export.`);

        if (flatBookings.length === 0) {
            return new NextResponse('No data found for the selected filters.', { status: 404 });
        }

        // --- Generate Excel Buffer ---
        const excelBuffer = await generateBookingsExcelBuffer(flatBookings);

        console.log('[API Export] Generated Excel buffer.');

        // --- Return Response ---
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="bookings_export_${new Date().toISOString().slice(0, 10)}.xlsx"`);

        return new NextResponse(excelBuffer, { status: 200, headers });

    } catch (error) {
        console.error('[API Export Error]:', error);
        // Provide a more specific error message if possible
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return new NextResponse(JSON.stringify({ error: 'Failed to export bookings', details: errorMessage }), { status: 500 });
    }
}