import type { Booking, BookingStatus } from "@prisma/client"

export async function createBooking(zoneId: string, startDate: Date, endDate: Date): Promise<Booking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zoneId, startDate, endDate }),
  })

  if (!response.ok) {
    throw new Error("Failed to create booking")
  }

  return response.json()
}

export async function getUserBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings")

  if (!response.ok) {
    throw new Error("Failed to fetch user bookings")
  }

  return response.json()
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error("Failed to update booking status")
  }

  return response.json()
}

