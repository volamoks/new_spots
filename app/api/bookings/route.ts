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

    const { zoneId, startDate, endDate } = await req.json()

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        zoneId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
        category: session.user.role === "CATEGORY_MANAGER" ? session.user.category : undefined,
      },
    })

    return NextResponse.json(booking)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get all bookings for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { zone: true },
    })

    return NextResponse.json(bookings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

