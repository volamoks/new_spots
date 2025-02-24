"use client"

import { useState } from "react"
import { useGlobalStore } from "@/lib/store"
import { createBooking, getUserBookings, updateBookingStatus } from "@/lib/api/bookings"
import type { BookingStatus } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"

export function useBookings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUserBookings } = useGlobalStore()
  const { toast } = useToast()

  const handleCreateBooking = async (zoneId: string, startDate: Date, endDate: Date) => {
    setIsLoading(true)
    setError(null)
    try {
      const newBooking = await createBooking(zoneId, startDate, endDate)
      setUserBookings((prevBookings) => [...prevBookings, newBooking])
      toast({
        title: "Бронирование создано",
        description: "Ваше бронирование успешно создано и ожидает подтверждения.",
        variant: "success",
      })
      return newBooking
    } catch (err) {
      setError(err.message)
      toast({
        title: "Ошибка бронирования",
        description: "Не удалось создать бронирование. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchUserBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const bookings = await getUserBookings()
      setUserBookings(bookings)
      return bookings
    } catch (err) {
      setError(err.message)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить ваши бронирования. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const updatedBooking = await updateBookingStatus(bookingId, status)
      setUserBookings((prevBookings) =>
        prevBookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
      )
      toast({
        title: "Статус обновлен",
        description: `Статус бронирования успешно обновлен на "${status}".`,
        variant: "success",
      })
      return updatedBooking
    } catch (err) {
      setError(err.message)
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить статус бронирования. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    createBooking: handleCreateBooking,
    fetchUserBookings: handleFetchUserBookings,
    updateBookingStatus: handleUpdateBookingStatus,
  }
}

