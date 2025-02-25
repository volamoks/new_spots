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
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id },
    });

    if (!bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found" },
        { status: 404 },
      );
    }

    // Update only if the user is a category manager or DMP manager
    if (session.user.role !== "CATEGORY_MANAGER" && session.user.role !== "DMP_MANAGER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedBookingRequest = await prisma.bookingRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedBookingRequest);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}