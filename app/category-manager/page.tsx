"use client"

"use client";

import { useState, useEffect } from "react";
import { RequestsTable, type Booking } from "../components/RequestsTable";
import { getBookings } from "@/lib/api/bookings";
import { useToast } from "@/components/ui/use-toast";
// import { RequestFilters } from "../components/RequestFilters"; // আপাতত প্রয়োজন নেই
import { CategoryManagerDashboard } from "../components/CategoryManagerDashboard";
import Navigation from "../components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { BookingStatus, RequestStatus } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function CategoryManagerPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { toast } = useToast();
  const { data: session } = useSession();

    const fetchBookings = async () => {
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
                            createdAt: Date;
                            updatedAt: Date;
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
                                createdAt: format(request.createdAt, 'yyyy-MM-dd'),
                                user: {
                                    name: request.user.name,
                                },
                            },
                        })),
                );
                setBookings(transformedBookings);
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
    fetchBookings();
  }, [toast]);

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve-km", bookingId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Optimistically update the UI
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "KM_APPROVED" }
            : booking
        )
      );

      toast({
        title: "Booking approved",
        description: "The booking has been approved successfully.",
      });

      fetchBookings(); // Fetch bookings again to ensure data consistency
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Error approving booking",
        description: err.message,
      });
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject-km", bookingId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "KM_REJECTED" }
            : booking
        )
      );

      toast({
        title: "Booking rejected",
        description: "The booking has been rejected successfully.",
      });

      fetchBookings(); // Fetch bookings again to ensure data consistency
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Error rejecting booking",
        description: err.message,
      });
    }
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

      // Optimistically update the UI
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingRequestId === requestId
            ? { ...booking, bookingRequest: { ...booking.bookingRequest, status: newStatus } }
            : booking
        )
      );

      toast({
        title: "Request status updated",
        description: `The request status has been updated to ${newStatus}.`,
      });

      fetchBookings(); // Fetch bookings again to ensure data consistency

    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Error updating request status",
        description: err.message,
      });
    }
  }


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
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList>
                <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
                <TabsTrigger value="requests">Заявки</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="mt-6">
                <CategoryManagerDashboard />
              </TabsContent>
              <TabsContent value="requests" className="mt-6">
                <div className="space-y-6">
                  <p className="text-gray-600">
                    Управляйте заявками на бронирование зон продаж
                  </p>
                  {/* <p className="text-gray-600">
                    Отфильтровано спотов: <span className="font-semibold">{filteredSpotsCount}</span>
                  </p> */}
                  {/* <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestFilters onFilterChange={handleFilterChange} />
                    </CardContent>
                  </Card> */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">
                        Заявки на бронирование
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestsTable
                        bookings={bookings}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        role="CATEGORY_MANAGER"
                        onRequestStatusChange={handleRequestStatusChange}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
