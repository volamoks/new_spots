import { prisma } from './prisma'
import { ZoneStatus, BookingStatus, Role } from '@prisma/client'

export async function getZones(filters: any) {
  // const zones = await prisma.zone.findMany({
  //   where: {
  //     mainMacrozone: filters.category,
  //     adjacentMacrozone: {
  //       contains: filters.macrozone
  //     },
  //     city: {
  //       in: filters.cities.length > 0 ? filters.cities : undefined
  //     },
  //     market: {
  //       in: filters.storeCategories.length > 0 ? filters.storeCategories : undefined
  //     },
  //     equipment: {
  //       in: filters.equipment.length > 0 ? filters.equipment : undefined
  //     },
  //     status: ZoneStatus.AVAILABLE
  //   }
  // })
  // return zones

  // Temporary return mock data
  return []
}

export async function bookZone(zoneId: string, userId: string, startDate: Date, endDate: Date, userRole: Role, category?: string) {
  // const user = await prisma.user.findUnique({ where: { id: userId } })
  // if (!user) throw new Error('User not found')

  // let bookingData: any = {
  //   userId,
  //   zoneId,
  //   startDate,
  //   endDate,
  //   status: BookingStatus.PENDING
  // }

  // if (userRole === Role.CATEGORY_MANAGER && category) {
  //   bookingData.category = category
  // }

  // const booking = await prisma.booking.create({ data: bookingData })

  // await prisma.zone.update({
  //   where: { id: zoneId },
  //   data: { status: ZoneStatus.BOOKED }
  // })

  // return booking

  // Temporary return mock data
  return { id: 'mock-booking-id', status: 'PENDING', category: category || null }
}

export async function approveBookingByCM(bookingId: string) {
  // const booking = await prisma.booking.update({
  //   where: { id: bookingId },
  //   data: { status: BookingStatus.APPROVED_BY_CM }
  // })
  // return booking

  // Temporary return mock data
  return { id: bookingId, status: 'APPROVED_BY_CM' }
}

export async function approveBookingByDMP(bookingId: string) {
  // const booking = await prisma.booking.update({
  //   where: { id: bookingId },
  //   data: { status: BookingStatus.APPROVED_BY_DMP }
  // })
  // return booking

  // Temporary return mock data
  return { id: bookingId, status: 'APPROVED_BY_DMP' }
}

export async function rejectBooking(bookingId: string) {
  // const booking = await prisma.booking.update({
  //   where: { id: bookingId },
  //   data: { status: BookingStatus.REJECTED }
  // })

  // // Освобождаем зону
  // await prisma.zone.update({
  //   where: { id: booking.zoneId },
  //   data: { status: ZoneStatus.AVAILABLE }
  // })

  // return booking

  // Temporary return mock data
  return { id: bookingId, status: 'REJECTED' }
}

export async function getBookingStatus(bookingId: string) {
  // const booking = await prisma.booking.findUnique({
  //   where: { id: bookingId }
  // })
  // return booking?.status

  // Temporary return mock status
  return 'PENDING'
}

export async function getSupplierBookings(supplierId: string) {
  // const bookings = await prisma.booking.findMany({
  //   where: { userId: supplierId },
  //   include: { zone: true }
  // })
  // return bookings

  // Temporary return mock data
  return []
}

export async function getCategoryManagerBookings(categoryManagerId: string) {
  // const bookings = await prisma.booking.findMany({
  //   where: { 
  //     userId: categoryManagerId,
  //     user: { role: Role.CATEGORY_MANAGER }
  //   },
  //   include: { zone: true }
  // })
  // return bookings

  // Temporary return mock data
  return []
}

