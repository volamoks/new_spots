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
    const status = searchParams.get("status");

    const whereClause: Prisma.BookingRequestWhereInput = {};

    if (requestId) {
      whereClause.id = requestId;
    }

    if (status) {
      whereClause.status = status as Prisma.EnumRequestStatusFilter;
    }
    // Убираем ограничение статуса по умолчанию, чтобы показывать все запросы,
    // включая архивные (CLOSED)

    switch (session.user.role) {
      case "SUPPLIER":
        whereClause.userId = session.user.id;
        break;
      case "CATEGORY_MANAGER":
        // Если запрошен конкретный статус запроса (например, CLOSED), то не фильтруем по статусу бронирований
        if (!status) {
          // Если статус не указан, то показываем запросы с бронированиями PENDING_KM или запросы со статусом CLOSED
          whereClause.OR = [
            {
              bookings: {
                some: {
                  status: "PENDING_KM" // Показываем запросы с бронированиями PENDING_KM
                }
              }
            },
            { status: "CLOSED" } // Показываем закрытые запросы (история)
          ];
        }
        
        // Фильтрация по категории КМ сохраняется в любом случае
        const categoryFilter = [
          { category: session.user.category },
          { category: null }
        ];
        
        // Если у КМ есть категория, показываем только запросы из его категории или без категории
        if (session.user.category) {
          if (whereClause.OR) {
            // Если уже есть OR-условие для статусов, добавляем условие категории к каждому варианту
            whereClause.OR = whereClause.OR.map(condition => ({
              ...condition,
              OR: categoryFilter
            }));
          } else {
            // Иначе просто добавляем условие фильтрации по категории
            whereClause.OR = categoryFilter;
          }
        }
        break;
      case "DMP_MANAGER":
        // Если запрошен конкретный статус запроса (например, CLOSED), то не фильтруем по статусу бронирований
        if (!status) {
          // Если статус не указан, то показываем запросы с бронированиями KM_APPROVED или запросы со статусом CLOSED
          whereClause.OR = [
            {
              bookings: {
                some: {
                  status: "KM_APPROVED" // Показываем запросы с бронированиями KM_APPROVED
                }
              }
            },
            { status: "CLOSED" } // Показываем закрытые запросы (история)
          ];
        }
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
        user: true, // Добавляем включение информации о пользователе
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
