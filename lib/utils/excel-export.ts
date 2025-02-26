import ExcelJS from 'exceljs';
import { Zone, BookingRequest, Booking, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Интерфейс для расширенного бронирования с зоной и запросом
 */
interface BookingWithDetails extends Booking {
  zone: Zone;
  bookingRequest: BookingRequest & {
    user: User;
  };
}

/**
 * Создает рабочую книгу Excel с данными о зонах
 * @returns Promise<Buffer> Буфер с данными Excel-файла
 */
export async function exportZonesToExcel(): Promise<ExcelJS.Buffer> {
  // Получаем все зоны из базы данных
  const zones = await prisma.zone.findMany({
    orderBy: [
      { city: 'asc' },
      { market: 'asc' }
    ],
  });

  // Создаем новую рабочую книгу Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StoreSpotsBooking';
  workbook.created = new Date();
  
  // Создаем лист для зон
  const worksheet = workbook.addWorksheet('Zones');
  
  // Определяем заголовки
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Уникальный ID', key: 'uniqueIdentifier', width: 15 },
    { header: 'Город', key: 'city', width: 15 },
    { header: 'Номер', key: 'number', width: 10 },
    { header: 'Магазин', key: 'market', width: 20 },
    { header: 'Новый формат', key: 'newFormat', width: 15 },
    { header: 'Оборудование', key: 'equipment', width: 15 },
    { header: 'Размеры', key: 'dimensions', width: 15 },
    { header: 'Основная макрозона', key: 'mainMacrozone', width: 20 },
    { header: 'Смежная макрозона', key: 'adjacentMacrozone', width: 20 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Поставщик', key: 'supplier', width: 20 },
    { header: 'Бренд', key: 'brand', width: 15 },
    { header: 'Категория', key: 'category', width: 15 },
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
  zones.forEach(zone => {
    worksheet.addRow({
      ...zone,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    });
  });
  
  // Создаем буфер для записи файла
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Создает рабочую книгу Excel с данными о бронированиях
 * @returns Promise<Buffer> Буфер с данными Excel-файла
 */
export async function exportBookingsToExcel(): Promise<ExcelJS.Buffer> {
  // Получаем все бронирования с деталями
  const bookings = await prisma.booking.findMany({
    include: {
      zone: true,
      bookingRequest: {
        include: {
          user: true,
        },
      },
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
  
  // Определяем заголовки
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
  bookings.forEach((booking: BookingWithDetails) => {
    worksheet.addRow({
      id: booking.id,
      bookingRequestId: booking.bookingRequestId,
      status: booking.status,
      userName: booking.bookingRequest?.user?.name,
      userEmail: booking.bookingRequest?.user?.email,
      userRole: booking.bookingRequest?.user?.role,
      category: booking.bookingRequest?.category,
      zoneId: booking.zone?.id,
      zoneUniqueId: booking.zone?.uniqueIdentifier,
      city: booking.zone?.city,
      market: booking.zone?.market,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    });
  });
  
  // Создаем буфер для записи файла
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Экспортирует все данные базы данных в Excel-файл
 * @returns Promise<Buffer> Буфер с данными Excel-файла
 */
export async function exportDatabaseToExcel(): Promise<ExcelJS.Buffer> {
  // Получаем все данные из базы
  const zones = await prisma.zone.findMany({
    orderBy: [{ city: 'asc' }, { market: 'asc' }],
  });
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      category: true,
      inn: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      user: true,
      bookings: {
        include: {
          zone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Создаем новую рабочую книгу Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StoreSpotsBooking';
  workbook.created = new Date();
  
  // Создаем лист для зон
  const zonesSheet = workbook.addWorksheet('Zones');
  zonesSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Уникальный ID', key: 'uniqueIdentifier', width: 15 },
    { header: 'Город', key: 'city', width: 15 },
    { header: 'Номер', key: 'number', width: 10 },
    { header: 'Магазин', key: 'market', width: 20 },
    { header: 'Новый формат', key: 'newFormat', width: 15 },
    { header: 'Оборудование', key: 'equipment', width: 15 },
    { header: 'Размеры', key: 'dimensions', width: 15 },
    { header: 'Основная макрозона', key: 'mainMacrozone', width: 20 },
    { header: 'Смежная макрозона', key: 'adjacentMacrozone', width: 20 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Поставщик', key: 'supplier', width: 20 },
    { header: 'Бренд', key: 'brand', width: 15 },
    { header: 'Категория', key: 'category', width: 15 },
  ];
  zonesSheet.getRow(1).font = { bold: true };
  zones.forEach(zone => {
    zonesSheet.addRow(zone);
  });
  
  // Создаем лист для пользователей
  const usersSheet = workbook.addWorksheet('Users');
  usersSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Имя', key: 'name', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Роль', key: 'role', width: 15 },
    { header: 'Категория', key: 'category', width: 15 },
    { header: 'ИНН', key: 'inn', width: 15 },
    { header: 'Статус', key: 'status', width: 15 },
  ];
  usersSheet.getRow(1).font = { bold: true };
  users.forEach(user => {
    usersSheet.addRow(user);
  });
  
  // Создаем лист для запросов на бронирование
  const requestsSheet = workbook.addWorksheet('BookingRequests');
  requestsSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Пользователь', key: 'userName', width: 20 },
    { header: 'Email пользователя', key: 'userEmail', width: 25 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Категория', key: 'category', width: 15 },
    { header: 'Создано', key: 'createdAt', width: 20 },
  ];
  requestsSheet.getRow(1).font = { bold: true };
  bookingRequests.forEach(request => {
    requestsSheet.addRow({
      id: request.id,
      userName: request.user?.name,
      userEmail: request.user?.email,
      status: request.status,
      category: request.category,
      createdAt: request.createdAt.toISOString(),
    });
  });
  
  // Создаем лист для бронирований
  const bookingsSheet = workbook.addWorksheet('Bookings');
  bookingsSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'ID запроса', key: 'requestId', width: 40 },
    { header: 'ID зоны', key: 'zoneId', width: 40 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Город', key: 'city', width: 15 },
    { header: 'Магазин', key: 'market', width: 20 },
    { header: 'Создано', key: 'createdAt', width: 20 },
  ];
  bookingsSheet.getRow(1).font = { bold: true };
  
  bookingRequests.forEach(request => {
    request.bookings.forEach(booking => {
      bookingsSheet.addRow({
        id: booking.id,
        requestId: booking.bookingRequestId,
        zoneId: booking.zoneId,
        status: booking.status,
        city: booking.zone?.city,
        market: booking.zone?.market,
        createdAt: booking.createdAt.toISOString(),
      });
    });
  });
  
  // Создаем буфер для записи файла
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}