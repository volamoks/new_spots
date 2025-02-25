// Удаляем неиспользуемые импорты

export async function getBookings() {
    try {
        // Используем API endpoint для получения бронирований,
        // который правильно фильтрует данные в зависимости от роли пользователя
        const response = await fetch('/api/bookings');
        
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
