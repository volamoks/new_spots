"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCategoryManagerBookings, approveBookingByCM, rejectBooking } from "@/lib/zones"
import { useGlobalStore } from "@/lib/store"

export function CategoryManagerBookings() {
  const [bookings, setBookings] = useState([])
  const { user } = useGlobalStore()

  useEffect(() => {
    if (user && user.role === "CATEGORY_MANAGER") {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    if (user) {
      const fetchedBookings = await getCategoryManagerBookings(user.id)
      setBookings(fetchedBookings)
    }
  }

  const handleApprove = async (bookingId) => {
    await approveBookingByCM(bookingId)
    loadBookings()
  }

  const handleReject = async (bookingId) => {
    await rejectBooking(bookingId)
    loadBookings()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бронирования для согласования</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID бронирования</TableHead>
              <TableHead>Зона</TableHead>
              <TableHead>Поставщик</TableHead>
              <TableHead>Даты</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.id}</TableCell>
                <TableCell>{booking.zone.number}</TableCell>
                <TableCell>{booking.user.name}</TableCell>
                <TableCell>{`${booking.startDate} - ${booking.endDate}`}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>
                  {booking.status === "PENDING" && (
                    <>
                      <Button onClick={() => handleApprove(booking.id)} className="mr-2">
                        Согласовать
                      </Button>
                      <Button onClick={() => handleReject(booking.id)} variant="destructive">
                        Отклонить
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

