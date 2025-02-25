"use client";

import { useState, useEffect } from "react";
import { RequestsTable } from "../components/RequestsTable";
import type { Booking } from "../components/RequestsTable";
import { RequestFilters, type RequestFilterState } from "../components/RequestFilters";
import Navigation from "../components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getBookings } from "@/lib/api/bookings";
import { useToast } from "@/components/ui/use-toast";
import { BookingStatus, RequestStatus } from "@prisma/client";
import { format } from 'date-fns';
import { useSession } from "next-auth/react";

export default function DMPManagerPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const { toast } = useToast();
  const { data: session } = useSession();

  const fetchBookingsData = async () => {
    try {
      console.log("Session:", session);
      const bookingsData = await getBookings();
      console.log("Bookings data:", bookingsData);
      if (bookingsData) {
        // Transform the data to match the Booking type
        const transformedBookings: Booking[] = bookingsData.flatMap(
          (request: {
            id: string;
            userId: string;
            status: RequestStatus;
            category: string | null;
            createdAt: Date;
            updatedAt: Date;
            user: { name: string | null; };
            bookings: {
              id: string;
              bookingRequestId: string;
              zoneId: string;
              status: BookingStatus;
              createdAt: string;
              updatedAt: string;
              zone: {
                id: string;
                city: string;
                number: string;
                market: string;
                newFormat: string;
                equipment: string;
                dimensions: string;
                mainMacrozone: string;
                adjacentMacrozone: string;
              }
            }[]
          }) =>
            request.bookings.map((booking) => ({
              id: booking.id,
              bookingRequestId: booking.bookingRequestId,
              zoneId: booking.zoneId,
              status: booking.status,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
              zone: {
                id: booking.zone.id,
                city: booking.zone.city,
                number: booking.zone.number,
                market: booking.zone.market,
                newFormat: booking.zone.newFormat,
                equipment: booking.zone.equipment,
                dimensions: booking.zone.dimensions,
                mainMacrozone: booking.zone.mainMacrozone,
                adjacentMacrozone: booking.zone.adjacentMacrozone,
              },
              bookingRequest: {
                userId: request.userId,
                status: request.status,
                category: request.category,
                createdAt: format(new Date(request.createdAt), 'yyyy-MM-dd'),
                user: {
                  name: request.user.name,
                },
              },
            })),
        );
        setBookings(transformedBookings);
        setFilteredBookings(transformedBookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBookingsData();
  }, [toast]);

  const handleApprove = (bookingId: string) => {
    // Implement the logic to approve a booking by calling the API
    fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "approve-dmp", bookingId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to approve booking");
        }
        return response.json();
      })
      .then((updatedBooking) => {
        // Update local state to reflect the change
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === updatedBooking.id ? updatedBooking : booking
          )
        );
        setFilteredBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === updatedBooking.id ? updatedBooking : booking
          )
        );
        fetchBookingsData(); // Перезагружаем данные для обеспечения консистентности
      })
      .catch((error) => {
        console.error("Error approving booking:", error);
        toast({
          title: "Error",
          description: "Failed to approve booking.",
          variant: "destructive",
        });
      });
  };

  const handleReject = (bookingId: string) => {
    // Implement the logic to reject a booking by calling the API
    fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "reject-dmp", bookingId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to reject booking");
        }
        return response.json();
      })
      .then((updatedBooking) => {
        // Update local state to reflect the change
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === updatedBooking.id ? updatedBooking : booking
          )
        );
        setFilteredBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === updatedBooking.id ? updatedBooking : booking
          )
        );
        fetchBookingsData(); // Перезагружаем данные для обеспечения консистентности
      })
      .catch((error) => {
        console.error("Error rejecting booking:", error);
        toast({
          title: "Error",
          description: "Failed to reject booking.",
          variant: "destructive",
        });
      });
  };

  const handleFilterChange = (filters: RequestFilterState) => {
    let filtered = bookings;

    // Apply filtering logic based on 'filters'
    // This is a placeholder, adjust according to your actual filtering needs
    if (filters.status) {
      filtered = filtered.filter((booking) => booking.bookingRequest.status === filters.status);
    }

    setFilteredBookings(filtered);
  };

  const handleRequestStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Оптимистично обновляем UI
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingRequestId === requestId
            ? { ...booking, bookingRequest: { ...booking.bookingRequest, status: newStatus } }
            : booking
        )
      );
      
      setFilteredBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingRequestId === requestId
            ? { ...booking, bookingRequest: { ...booking.bookingRequest, status: newStatus } }
            : booking
        )
      );

      toast({
        title: "Статус запроса обновлен",
        description: `Статус запроса изменен на ${newStatus}.`,
      });

      fetchBookingsData(); // Перезагружаем данные для обеспечения консистентности
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Ошибка при обновлении статуса",
        description: err.message,
      });
    }
  };

  const filteredSpotsCount = filteredBookings.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Панель менеджера ДМП
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Управляйте заявками, согласованными категорийными менеджерами
            </p>
            <p className="text-gray-600 mt-2">
              Отфильтровано спотов:{" "}
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
              Заявки на рассмотрение
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsTable
              bookings={filteredBookings}
              onApprove={handleApprove}
              onReject={handleReject}
              role="DMP_MANAGER"
              onRequestStatusChange={handleRequestStatusChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
