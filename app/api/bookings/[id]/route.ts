import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";
import BookingRole from "@/lib/enums/BookingRole";

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
    let expectedRole = null;

    if (role === BookingRole.KM) {
      expectedRole = "CATEGORY_MANAGER";
    } else if (role === BookingRole.DMP) {
      expectedRole = "DMP_MANAGER";
    }
    if (expectedRole && session.user.role !== expectedRole) {
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
    if (status === BookingStatus.DMP_APPROVED && booking.status !== BookingStatus.KM_APPROVED) {
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
    // If booking is rejected, set the zone back to AVAILABLE
    if (
      updatedBooking.status === BookingStatus.KM_REJECTED ||
      updatedBooking.status === BookingStatus.DMP_REJECTED
    ) {
      await prisma.zone.update({
        where: { id: updatedBooking.zoneId },
        data: { status: "AVAILABLE", supplier: null, brand: null }, // Reset supplier and brand too
      });
    }


    // Check if all bookings in the request have been reviewed
    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id: booking.bookingRequestId },
      include: { bookings: true },
    });

    if (bookingRequest) {
      const allBookingsReviewed = bookingRequest.bookings.every(
        (b) => b.status === BookingStatus.KM_APPROVED || b.status === BookingStatus.KM_REJECTED ||
          b.status === BookingStatus.DMP_APPROVED || b.status === BookingStatus.DMP_REJECTED
      );

      if (allBookingsReviewed) {
        await prisma.bookingRequest.update({
          where: { id: booking.bookingRequestId },
          data: { status: "CLOSED" }, // Assuming you have a CLOSED status
        });
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error: unknown) {
    console.error('Error updating booking status:', error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
