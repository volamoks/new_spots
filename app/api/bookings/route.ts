import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createBookingRequest, getAllBookings } from "@/lib/services/bookingService";
import { handleApiError } from "@/lib/utils/api";

// Create a new booking request with multiple bookings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { zoneIds, supplierId, brandId } = body; // Add brandId
    console.log('[API Route] Received booking request body:', body); // Log entire body
    console.log(`[API Route] Extracted brandId: ${brandId}`); // Log extracted brandId

    // Ensure zoneIds is an array
    const zoneIdsArray = Array.isArray(zoneIds) ? zoneIds : [zoneIds];

    if (zoneIdsArray.length === 0) {
      return NextResponse.json(
        { error: "No zones specified for booking" },
        { status: 400 },
      );
    }

    // Для КМ проверяем наличие поставщика
    if (session.user.role === "CATEGORY_MANAGER" && !supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required for Category Manager bookings" },
        { status: 400 },
      );
    }

    // Вызов сервисной функции вместо внутренней логики
    const result = await createBookingRequest(
      session.user.id,
      zoneIdsArray,
      session.user.role,
      session.user.category,
      supplierId,
      brandId // Pass brandId to the service function
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// Get booking requests based on user role and optional requestId
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const bookingRequests = await getAllBookings(status ?? undefined);

    return NextResponse.json(bookingRequests);
  } catch (error) {
    return handleApiError(error);
  }
}
