import type { Booking, BookingRequest, BookingStatus } from "@prisma/client"

// Расширенный тип для BookingRequest с включенными бронированиями и зонами
export type BookingRequestWithBookings = BookingRequest & {
  bookings: (Booking & {
    zone: {
      id: string;
      uniqueIdentifier: string;
      city: string;
      number: string;
      market: string;
      newFormat: string;
      equipment: string;
      dimensions: string;
      mainMacrozone: string;
      adjacentMacrozone: string;
      status: string;
    }
  })[];
}

// Создание бронирования для одной или нескольких зон
export async function createBooking(
  zoneIds: string | string[],
  startDate: Date,
  endDate: Date
): Promise<{ bookingRequest: BookingRequest; bookings: Booking[] }> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      zoneIds,
      startDate,
      endDate
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create booking")
  }

  return response.json()
}

// Получение всех заявок на бронирование для текущего пользователя
export async function getUserBookings(): Promise<BookingRequestWithBookings[]> {
  const response = await fetch("/api/bookings")

  if (!response.ok) {
    throw new Error("Failed to fetch user bookings")
  }

  return response.json()
}

// Обновление статуса заявки на бронирование
export async function updateBookingStatus(
  bookingRequestId: string,
  status: BookingStatus
): Promise<BookingRequest> {
  const response = await fetch(`/api/bookings/${bookingRequestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error("Failed to update booking status")
  }

  return response.json()
}

