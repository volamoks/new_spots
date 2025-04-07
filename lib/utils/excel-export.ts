import ExcelJS from 'exceljs';
// No explicit Prisma types needed anymore
import { prisma } from '@/lib/prisma';

// Removed unused BookingWithDetails interface
// Removed unused exportZonesToExcel function
/**
 * Создает рабочую книгу Excel с данными о бронированиях
 * @returns Promise<Buffer> Буфер с данными Excel-файла
 */
export async function exportBookingsToExcel(): Promise<ExcelJS.Buffer> {
  // Получаем все бронирования с деталями
  // Получаем только необходимые поля бронирований и связанных данных
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      bookingRequestId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      zone: { // Select specific fields from Zone
        select: { // Select specific fields from Zone
          id: true,
          uniqueIdentifier: true,
          city: true,
          market: true,
          supplier: true, // <-- Add supplier
          brand: true,    // <-- Add brand
        }
      },
      bookingRequest: {
        select: {
          category: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Создаем новую рабочую книгу Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StoreSpotsBooking';
  workbook.created = new Date();

  // Создаем лист для бронирований
  const worksheet = workbook.addWorksheet('Bookings');

  // Определяем заголовки (добавляем Поставщик и Бренд)
  worksheet.columns = [
    { header: 'ID бронирования', key: 'id', width: 40 },
    { header: 'ID запроса', key: 'bookingRequestId', width: 40 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Пользователь', key: 'userName', width: 20 },
    { header: 'Email пользователя', key: 'userEmail', width: 25 },
    { header: 'Роль пользователя', key: 'userRole', width: 15 },
    { header: 'Категория', key: 'category', width: 15 },
    { header: 'Зона (ID)', key: 'zoneId', width: 40 },
    { header: 'Зона (уник. ID)', key: 'zoneUniqueId', width: 15 },
    { header: 'Город', key: 'city', width: 15 },
    { header: 'Магазин', key: 'market', width: 20 },
    { header: 'Поставщик', key: 'supplier', width: 20 }, // <-- Add supplier column
    { header: 'Бренд', key: 'brand', width: 15 },       // <-- Add brand column
    { header: 'Создано', key: 'createdAt', width: 20 },
    { header: 'Обновлено', key: 'updatedAt', width: 20 },
  ];

  // Стилизуем заголовки
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Добавляем данные
  // Use inferred type for booking, matching the 'select' structure
  bookings.forEach((booking) => {
    worksheet.addRow({
      id: booking.id,
      bookingRequestId: booking.bookingRequestId,
      status: booking.status,
      // Access nested selected fields directly
      userName: booking.bookingRequest?.user?.name ?? 'N/A', // Add nullish coalescing for safety
      userEmail: booking.bookingRequest?.user?.email ?? 'N/A',
      userRole: booking.bookingRequest?.user?.role ?? 'N/A',
      category: booking.bookingRequest?.category ?? 'N/A',
      zoneId: booking.zone?.id ?? 'N/A',
      zoneUniqueId: booking.zone?.uniqueIdentifier ?? 'N/A',
      city: booking.zone?.city ?? 'N/A',
      market: booking.zone?.market ?? 'N/A',
      supplier: booking.zone?.supplier ?? 'N/A', // <-- Add supplier data
      brand: booking.zone?.brand ?? 'N/A',       // <-- Add brand data
      createdAt: booking.createdAt.toISOString().slice(0, 10), // Format as YYYY-MM-DD
      updatedAt: booking.updatedAt.toISOString().slice(0, 10), // Format as YYYY-MM-DD
    });
  });

  // Создаем буфер для записи файла
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
} // <-- Add missing closing brace for exportBookingsToExcel
// Removed unused exportDatabaseToExcel function