"use client"

import { useState } from "react"
import { useGlobalStore } from "@/lib/store"
import {
  createBooking,
  getUserBookings,
  updateBookingStatus,
} from "@/lib/api/bookings"
import type { RequestStatus } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"

export function useBookings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setBookingRequests } = useGlobalStore()
  const { toast } = useToast()

  // Создание заявки на бронирование для одной или нескольких зон
  const handleCreateBooking = async (zoneIds: string[], startDate: Date, endDate: Date) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await createBooking(zoneIds, startDate, endDate)

      // Обновляем список заявок на бронирование в глобальном хранилище
      setBookingRequests((prevRequests) => [
        {
          ...result.bookingRequest,
          bookings: result.bookings.map(booking => ({
            ...booking,
            zone: {
              id: '', uniqueIdentifier: '', city: '', number: '', market: '', newFormat: '',
              equipment: '', dimensions: '', mainMacrozone: '', adjacentMacrozone: '', status: ''
            }
          }))
        },
        ...prevRequests
      ])

      toast({
        title: "Заявка создана",
        description: `Ваша заявка на бронирование ${zoneIds.length} зон успешно создана и ожидает подтверждения.`,
        variant: "success",
      })

      return result
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage)
      toast({
        title: "Ошибка бронирования",
        description: "Не удалось создать заявку на бронирование. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Получение всех заявок на бронирование для текущего пользователя
  const handleFetchUserBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const bookingRequests = await getUserBookings()
      setBookingRequests(bookingRequests)
      return bookingRequests
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить ваши заявки на бронирование. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Обновление статуса заявки на бронирование
  const handleUpdateBookingStatus = async (bookingRequestId: string, status: RequestStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const updatedBookingRequest = await updateBookingStatus(bookingRequestId, status)

      // Обновляем список заявок на бронирование в глобальном хранилище
      setBookingRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === bookingRequestId
            ? { ...request, status }
            : request
        ),
      )

      toast({
        title: "Статус обновлен",
        description: `Статус заявки на бронирование успешно обновлен на "${status}".`,
        variant: "success",
      })

      return updatedBookingRequest
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage)
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить статус заявки на бронирование. Пожалуйста, попробуйте еще раз.",
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
