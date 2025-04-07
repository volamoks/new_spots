import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
// Assume getAllBookings will be updated to handle filters and pagination
import { createBookingRequest, getAllBookings } from "@/lib/services/bookingService";
import { handleApiError } from "@/lib/utils/api";
import { BookingStatus, Role } from "@prisma/client"; // Import BookingStatus and Role enum
// Remove the incorrect UserRole type import

// Create a new booking request with multiple bookings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { zoneIds, supplierId, brandId } = body;
    console.log('[API Route] Received booking request body:', body);
    console.log(`[API Route] Extracted brandId: ${brandId}`);

    const zoneIdsArray = Array.isArray(zoneIds) ? zoneIds : [zoneIds];

    if (zoneIdsArray.length === 0) {
      return NextResponse.json(
        { error: "No zones specified for booking" },
        { status: 400 },
      );
    }

    // Ensure session.user.role is treated as UserRole enum
    const userRole = session.user.role as Role; // Use imported Role enum

    if (userRole === Role.CATEGORY_MANAGER && !supplierId) { // Compare with imported Role enum
      return NextResponse.json(
        { error: "Supplier ID is required for Category Manager bookings" },
        { status: 400 },
      );
    }

    const result = await createBookingRequest(
      session.user.id,
      zoneIdsArray,
      userRole, // Pass the validated role
      session.user.category,
      supplierId,
      brandId
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// Get booking requests with filtering and pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) { // Ensure session.user exists
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // --- Extract Pagination ---
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    // --- Extract Filters ---
    // Helper to safely get array or undefined
    const getAllOrUndefined = (key: string): string[] | undefined => {
      const values = searchParams.getAll(key);
      return values.length > 0 ? values : undefined;
    };

    // Helper to safely get string or undefined
    const getOrUndefined = (key: string): string | undefined => {
      const value = searchParams.get(key);
      return value === null || value === '' ? undefined : value;
    };

    const filters = {
      // Use getAll for potential multiple status values
      status: getAllOrUndefined("status") as BookingStatus[] | undefined, // Cast or validate if necessary
      supplierName: getOrUndefined("supplierName"),
      dateFrom: getOrUndefined("dateFrom"),
      dateTo: getOrUndefined("dateTo"),
      supplierInn: getOrUndefined("supplierInn"),
      supplierIds: getAllOrUndefined("supplierIds"), // Array of strings
      city: getAllOrUndefined("city"), // Array of strings
      market: getAllOrUndefined("market"), // Array of strings
      macrozone: getAllOrUndefined("macrozone"), // Array of strings
      equipment: getAllOrUndefined("equipment"), // Array of strings
      searchTerm: getOrUndefined("searchTerm"),
    };

    // Clean up filters: remove undefined keys
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter((entry) => entry[1] !== undefined) // Access value by index to avoid unused variable
    );

    console.log('[API Route - GET /bookings] Filters:', cleanedFilters);
    console.log('[API Route - GET /bookings] Pagination:', { page, pageSize });

    // Prepare user object for the service function
    const serviceUser = {
      id: session.user.id,
      role: session.user.role as Role, // Use imported Role enum
      inn: session.user.inn, // Pass INN if available
    };

    // Call the service function (needs modification)
    // It should now accept filters and pagination options
    const { data, totalCount } = await getAllBookings({
      filters: cleanedFilters, // Pass cleaned filters
      pagination: { page, pageSize },
      user: serviceUser // Pass user info for role-based filtering in service
    });

    // Return data in the expected format
    return NextResponse.json({ data, totalCount });

  } catch (error) {
    return handleApiError(error);
  }
}
