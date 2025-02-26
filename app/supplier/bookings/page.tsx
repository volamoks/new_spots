"use client";

import { useEffect, useCallback } from "react";
import { RequestsTable } from "../../components/RequestsTable";
import { RequestFilters, type RequestFilterState } from "../../components/RequestFilters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useBookingStore, useBookingToasts } from "@/lib/stores/bookingStore";

export default function SupplierBookingsPage() {
  const { data: session } = useSession();
  const {
    filteredBookings,
    fetchBookings,
    applyFilters,
    error
  } = useBookingStore();
  
  const { showErrorToast } = useBookingToasts();

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        await fetchBookings();
        if (error) {
          showErrorToast("Ошибка", error);
        }
      }
    };
    
    loadData();
  }, [session, fetchBookings, error, showErrorToast]);

  // Обработчик фильтрации
  const handleFilterChange = useCallback((filters: RequestFilterState) => {
    applyFilters(filters);
  }, [applyFilters]);

  // Пустые обработчики, так как поставщику не нужны действия
  const handleApprove = useCallback(() => {}, []);
  const handleReject = useCallback(() => {}, []);
  const handleRequestStatusChange = useCallback(() => {}, []);

  const filteredSpotsCount = filteredBookings.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* <Navigation /> */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Мои бронирования
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Просмотр статуса ваших заявок на бронирование
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
              role="SUPPLIER"
              onRequestStatusChange={handleRequestStatusChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}