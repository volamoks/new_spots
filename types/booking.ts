import { BookingStatus, RequestStatus } from "@prisma/client";

export { BookingStatus, RequestStatus }; // Экспортируем типы из Prisma для использования в других модулях

/**
 * Интерфейс для представления зоны в UI
 */
export interface ZoneUI {
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

/**
 * Интерфейс для представления пользователя в UI
 */
export interface UserUI {
  name: string;
}

/**
 * Интерфейс для представления запроса на бронирование в UI
 */
export interface BookingRequestUI {
  userId: string;
  status: RequestStatus;
  category: string | null;
  createdAt: string;
  user: UserUI;
}

/**
 * Интерфейс для представления бронирования в UI
 */
export interface BookingUI {
  id: string;
  bookingRequestId: string;
  zoneId: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  zone: ZoneUI;
  bookingRequest: BookingRequestUI;
}

/**
 * Интерфейс для запроса на бронирование из API
 */
export interface BookingRequestWithBookings {
  id: string;
  userId: string;
  status: RequestStatus;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Дополнительные поля пользователя, которые могут быть в API
  };
  bookings?: BookingFromApi[];
}

/**
 * Интерфейс для бронирования из API
 */
export interface BookingFromApi {
  id: string;
  bookingRequestId: string;
  zoneId: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  zone?: {
    id: string;
    city: string;
    number: string;
    market: string;
    newFormat: string;
    equipment: string;
    dimensions: string;
    mainMacrozone: string;
    adjacentMacrozone: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Дополнительные поля зоны, которые могут быть в API
  };
}

/**
 * Интерфейс для состояния фильтров запросов
 */
export interface RequestFilterState {
  status: string;
  supplierName: string;
  dateFrom: string;
  dateTo: string;
}