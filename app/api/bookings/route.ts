import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

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

    // Create the booking request
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        userId: session.user.id,
        status: "NEW", // Set request status to NEW
        category:
          session.user.role === "CATEGORY_MANAGER"
            ? session.user.category
            : undefined,
      },
    });

    // Create bookings for each zone
    const bookings = [];
    for (const zoneId of zoneIdsArray) {
      const zone = await prisma.zone.findUnique({
        where: { uniqueIdentifier: zoneId },
      });

      if (!zone) {
        console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`);
        continue;
      }

      const booking = await prisma.booking.create({
        data: {
          bookingRequestId: bookingRequest.id,
          zoneId: zone.id,
          status: "PENDING_KM", // Set booking status to PENDING_KM
        },
      });
      bookings.push(booking);
    }

    return NextResponse.json({
      bookingRequest,
      bookings,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const whereClause: Prisma.BookingRequestWhereInput = {};

    if (requestId) {
      whereClause.id = requestId;
    }

    switch (session.user.role) {
      case "SUPPLIER":
        whereClause.userId = session.user.id;
        break;
      case "CATEGORY_MANAGER":
        // КМ видит все запросы, в которых есть бронирования со статусом PENDING_KM
        whereClause.bookings = {
          some: {
            status: "PENDING_KM", // Filter by PENDING_KM for Category Managers
          },
        };
        
        // Если у КМ есть категория, показываем только запросы из его категории
        // или запросы без указанной категории
        if (session.user.category) {
          whereClause.OR = [
            { category: session.user.category },
            { category: null }
          ];
        }
        break;
      case "DMP_MANAGER":
        whereClause.bookings = {
          some: {
            status: "KM_APPROVED", // Filter by KM_APPROVED for DMP Managers
          },
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

    const bookingRequests = await prisma.bookingRequest.findMany({
      where: whereClause,
      include: {
        bookings: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookingRequests);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
