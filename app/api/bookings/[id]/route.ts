import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // This is the BookingRequest ID
    const { action, bookingId } = await req.json(); // bookingId is the ID of the individual Booking

    if (!action || !bookingId) {
      return NextResponse.json(
        { error: "Action and bookingId are required" },
        { status: 400 },
      );
    }

    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { bookings: true },
    });

    if (!bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found" },
        { status: 404 },
      );
    }

    const validBookingIds = bookingRequest.bookings.map((booking) => booking.id);

    if (!validBookingIds.includes(bookingId)) {
      return NextResponse.json(
        { error: "Invalid bookingId for this request" },
        { status: 400 },
      );
    }

    let updatedBooking;

    switch (action) {
      case "approve-km":
        if (session.user.role !== "CATEGORY_MANAGER") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "KM_APPROVED" },
        });
        break;
      case "approve-dmp":
        if (session.user.role !== "DMP_MANAGER") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // Check if the booking is already KM_APPROVED
        const currentBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });
        if (currentBooking?.status !== "KM_APPROVED") {
          return NextResponse.json(
            { error: "Booking must be approved by KM first" },
            { status: 400 },
          );
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "DMP_APPROVED" },
        });
        break;
      case "reject-km":
        if (session.user.role !== "CATEGORY_MANAGER") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "KM_REJECTED" },
        });
        break;
      case "reject-dmp":
        if (session.user.role !== "DMP_MANAGER") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "DMP_REJECTED" },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Check if all bookings in the request have been reviewed by KM
    const allBookingsReviewed = bookingRequest.bookings.every(
      (booking) =>
        booking.status === "KM_APPROVED" || booking.status === "KM_REJECTED",
    );

    if (allBookingsReviewed) {
      await prisma.bookingRequest.update({
        where: { id },
        data: { status: "CLOSED" },
      });
    }

    return NextResponse.json(updatedBooking);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
