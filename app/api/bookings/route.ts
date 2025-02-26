import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createBookingRequest, fetchBookingRequests } from "@/lib/services/bookingService";
import { handleApiError } from "@/lib/utils/api";

// Create a new booking request with multiple bookings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zoneIds } = await req.json();

    // Ensure zoneIds is an array
    const zoneIdsArray = Array.isArray(zoneIds) ? zoneIds : [zoneIds];

    if (zoneIdsArray.length === 0) {
      return NextResponse.json(
        { error: "No zones specified for booking" },
        { status: 400 },
      );
    }

    // Вызов сервисной функции вместо внутренней логики
    const result = await createBookingRequest(
      session.user.id,
      zoneIdsArray,
      session.user.role,
      session.user.category
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
    const requestId = searchParams.get("requestId");
    const status = searchParams.get("status");

    // Вызов сервисной функции вместо внутренней логики
    const bookingRequests = await fetchBookingRequests(
      session.user.id,
      session.user.role,
      session.user.category,
      requestId,
      status
    );

    return NextResponse.json(bookingRequests);
  } catch (error) {
    return handleApiError(error);
  }
}
