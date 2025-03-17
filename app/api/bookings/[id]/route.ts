import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // This is the Booking ID
    const { status, role } = await req.json();

    if (!status || !role) {
      return NextResponse.json(
        { error: "Status and role are required" },
        { status: 400 },
      );
    }

    // Validate the role
    if (role === "CATEGORY_MANAGER" && session.user.role !== "CATEGORY_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role === "DMP_MANAGER" && session.user.role !== "DMP_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { bookingRequest: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    // Validate the status transition
    if (status === "DMP_APPROVED" && booking.status !== "KM_APPROVED") {
      return NextResponse.json(
        { error: "Booking must be approved by KM first" },
        { status: 400 },
      );
    }

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
    });

    // Check if all bookings in the request have been reviewed
    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id: booking.bookingRequestId },
      include: { bookings: true },
    });

    if (bookingRequest) {
      const allBookingsReviewed = bookingRequest.bookings.every(
        (b) => b.status === "KM_APPROVED" || b.status === "KM_REJECTED" || 
               b.status === "DMP_APPROVED" || b.status === "DMP_REJECTED"
      );

      if (allBookingsReviewed) {
        await prisma.bookingRequest.update({
          where: { id: booking.bookingRequestId },
          data: { status: "CLOSED" },
        });
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error: unknown) {
    console.error('Error updating booking status:', error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
