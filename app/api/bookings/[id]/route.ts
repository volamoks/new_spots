import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await req.json()
    const bookingId = params.id

    // Check if the user has the right to update the booking status
    if (
      (status === "APPROVED_BY_CM" && session.user.role !== "CATEGORY_MANAGER") ||
      (status === "APPROVED_BY_DMP" && session.user.role !== "DMP_MANAGER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

