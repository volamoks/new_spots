import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Create a new booking
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Session in bookings API:", JSON.stringify(session, null, 2))
    console.log("User ID:", session.user.id)
    console.log("User object:", JSON.stringify(session.user, null, 2))

    const { zoneIds, startDate, endDate } = await req.json()
    
    // Проверяем, что zoneIds - это массив
    const zoneIdsArray = Array.isArray(zoneIds) ? zoneIds : [zoneIds]
    
    if (zoneIdsArray.length === 0) {
      return NextResponse.json(
        { error: "No zones specified for booking" },
        { status: 400 }
      )
    }

    // Создаем заявку на бронирование
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        userId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
        category: session.user.role === "CATEGORY_MANAGER" ? session.user.category : undefined,
      },
    })

    // Создаем бронирования для каждой зоны
    const bookings = []
    for (const zoneId of zoneIdsArray) {
      // Находим зону по uniqueIdentifier
      const zone = await prisma.zone.findUnique({
        where: { uniqueIdentifier: zoneId }
      })

      if (!zone) {
        console.warn(`Zone with uniqueIdentifier ${zoneId} not found, skipping`)
        continue
      }

      // Создаем бронирование для этой зоны
      const booking = await prisma.booking.create({
        data: {
          bookingRequestId: bookingRequest.id,
          zoneId: zone.id,
          status: "PENDING",
        },
      })

      bookings.push(booking)
    }

    // Возвращаем заявку на бронирование вместе с созданными бронированиями
    return NextResponse.json({
      bookingRequest,
      bookings
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get all booking requests for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("GET Booking Requests - User ID:", session.user.id)

    const bookingRequests = await prisma.bookingRequest.findMany({
      where: { userId: session.user.id },
      include: {
        bookings: {
          include: {
            zone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookingRequests)
  } catch (error: any) {
    console.error("Error fetching booking requests:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
