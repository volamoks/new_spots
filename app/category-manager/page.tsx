"use client";

import { useEffect, useCallback } from "react";
import { RequestsTable } from "../components/RequestsTable";
import { RequestFilters, type RequestFilterState } from "../components/RequestFilters";
import Navigation from "../components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useBookingStore, useBookingToasts } from "@/lib/stores/bookingStore";

export default function CategoryManagerPage() {
  const { data: session } = useSession();
  const {
    filteredBookings,
    fetchBookings,
    approveBooking,
    rejectBooking,
    updateRequestStatus,
    applyFilters,
    error
  } = useBookingStore();
  
  const { showSuccessToast, showErrorToast } = useBookingToasts();

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        // Загружаем данные без параметра статуса, чтобы API использовало
        // нашу обновленную логику для показа активных и закрытых заявок
        await fetchBookings();
        if (error) {
          showErrorToast("Ошибка", error);
        }
      }
    };
    
    loadData();
  }, [session, fetchBookings, error, showErrorToast]);

  // Обработчики событий для таблицы с обработкой уведомлений
  const handleApprove = useCallback(async (bookingId: string) => {
    await approveBooking(bookingId, 'CATEGORY_MANAGER');
    if (!error) {
      showSuccessToast("Успешно", "Бронирование одобрено");
    } else {
      showErrorToast("Ошибка", error);
    }
  }, [approveBooking, error, showSuccessToast, showErrorToast]);

  const handleReject = useCallback(async (bookingId: string) => {
    await rejectBooking(bookingId, 'CATEGORY_MANAGER');
    if (!error) {
      showSuccessToast("Успешно", "Бронирование отклонено");
    } else {
      showErrorToast("Ошибка", error);
    }
  }, [rejectBooking, error, showSuccessToast, showErrorToast]);

  const handleFilterChange = useCallback(async (filters: RequestFilterState) => {
    // Если выбран конкретный статус - загружаем данные с сервера с этим статусом
    if (filters.status && filters.status !== 'all') {
      await fetchBookings(filters.status);
      if (error) {
        showErrorToast("Ошибка", error);
      }
    } else if (filters.status === 'all') {
      // Если выбраны "Все" статусы - загружаем данные без параметра статуса
      await fetchBookings();
      if (error) {
        showErrorToast("Ошибка", error);
      }
    }
    
    // В любом случае применяем фильтры локально
    applyFilters(filters);
  }, [applyFilters, fetchBookings, error, showErrorToast]);

  const handleRequestStatusChange = useCallback(async (requestId: string, newStatus: string) => {
    await updateRequestStatus(requestId, newStatus);
    if (!error) {
      showSuccessToast("Статус запроса обновлен", `Статус запроса изменен на ${newStatus}`);
    } else {
      showErrorToast("Ошибка", error);
    }
  }, [updateRequestStatus, error, showSuccessToast, showErrorToast]);

  const filteredSpotsCount = filteredBookings.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Панель категорийного менеджера
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Управляйте заявками на бронирование зон продаж
            </p>
            <p className="text-gray-600 mt-2">
              Количество заявок:{" "}
              <span className="font-semibold">{filteredSpotsCount}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestFilters onFilterChange={handleFilterChange} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Заявки на бронирование
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsTable
              bookings={filteredBookings}
              onApprove={handleApprove}
              onReject={handleReject}
              role="CATEGORY_MANAGER"
              onRequestStatusChange={handleRequestStatusChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
