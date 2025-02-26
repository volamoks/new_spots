import { BookingRequestWithBookings, BookingFromApi, RequestStatus } from "@/types/booking";

/**
 * Результат создания бронирования
 */
interface BookingCreationResult {
    bookingRequest: BookingRequestWithBookings;
    bookings: BookingFromApi[];
}

// Получение всех бронирований
export async function getBookings(url: string = '/api/bookings'): Promise<BookingRequestWithBookings[] | null> {
    try {
        // Используем API endpoint для получения бронирований,
        // который правильно фильтрует данные в зависимости от роли пользователя
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const bookingRequests = await response.json();
        return bookingRequests;
    }
    catch (e) {
        console.error("Error fetching bookings:", e);
        return null;
    }
}

// Создание новой заявки на бронирование
// Параметры startDate и endDate добавлены для совместимости с интерфейсом, но пока не используются API
export async function createBooking(zoneIds: string[], startDate?: Date, endDate?: Date): Promise<BookingCreationResult> {
    try {
        // Включаем даты в запрос на будущее, хотя API их может пока игнорировать
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                zoneIds,
                ...(startDate && { startDate: startDate.toISOString() }),
                ...(endDate && { endDate: endDate.toISOString() })
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (e) {
        console.error("Error creating booking:", e);
        throw e;
    }
}

// Получение бронирований текущего пользователя
export async function getUserBookings(): Promise<BookingRequestWithBookings[]> {
    try {
        const response = await fetch('/api/bookings');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const bookingRequests = await response.json();
        return bookingRequests;
    } catch (e) {
        console.error("Error fetching user bookings:", e);
        throw e;
    }
}

// Обновление статуса бронирования
export async function updateBookingStatus(bookingRequestId: string, status: RequestStatus) {
    try {
        const response = await fetch(`/api/requests/${bookingRequestId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (e) {
        console.error("Error updating booking status:", e);
        throw e;
    }
}
