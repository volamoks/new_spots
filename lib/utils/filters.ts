import { Prisma } from "@prisma/client";

/**
 * Строит фильтры для запросов бронирований в зависимости от роли пользователя
 * @param userRole Роль пользователя
 * @param userId ID пользователя
 * @param requestId ID запроса (опционально)
 * @param status Статус запроса (опционально)
 * @param userCategory Категория пользователя (опционально, для категорийных менеджеров)
 * @returns Объект условий для Prisma запроса
 */
export function buildBookingFilters(
  userRole: string,
  userId: string,
  requestId?: string | null,
  status?: string | null,
  userCategory?: string | null
): Prisma.BookingRequestWhereInput {
  const whereClause: Prisma.BookingRequestWhereInput = {};

  // Добавляем общие фильтры
  if (requestId) {
    whereClause.id = requestId;
  }

  if (status) {
    whereClause.status = status as Prisma.EnumRequestStatusFilter;
  }

  // Применяем фильтры в зависимости от роли
  switch (userRole) {
    case "SUPPLIER":
      return buildSupplierFilters(whereClause, userId);
    case "CATEGORY_MANAGER":
      return buildCategoryManagerFilters(whereClause, status, userCategory);
    case "DMP_MANAGER":
      return buildDmpManagerFilters(whereClause, status);
    default:
      throw new Error("Invalid user role");
  }
}

/**
 * Строит фильтры для поставщика
 */
function buildSupplierFilters(
  baseFilter: Prisma.BookingRequestWhereInput,
  userId: string
): Prisma.BookingRequestWhereInput {
  return {
    ...baseFilter,
    userId: userId,
  };
}

/**
 * Строит фильтры для категорийного менеджера
 */
function buildCategoryManagerFilters(
  baseFilter: Prisma.BookingRequestWhereInput,
  status?: string | null,
  userCategory?: string | null
): Prisma.BookingRequestWhereInput {
  const filter = { ...baseFilter };

  // Если запрошен конкретный статус запроса, не фильтруем по статусу бронирований
  if (!status) {
    // Если статус не указан, показываем запросы с бронированиями PENDING_KM или запросы со статусом CLOSED
    filter.OR = [
      {
        bookings: {
          some: {
            status: "PENDING_KM"
          }
        }
      },
      { status: "CLOSED" }
    ];
  }

  // Фильтрация по категории КМ
  const categoryFilter = [
    { category: userCategory },
    { category: null }
  ];

  // Если у КМ есть категория, показываем только запросы из его категории или без категории
  if (userCategory) {
    if (filter.OR) {
      // Если уже есть OR-условие для статусов, добавляем условие категории к каждому варианту
      filter.OR = filter.OR.map(condition => ({
        ...condition,
        OR: categoryFilter
      }));
    } else {
      // Иначе просто добавляем условие фильтрации по категории
      filter.OR = categoryFilter;
    }
  }

  return filter;
}

/**
 * Строит фильтры для DMP менеджера
 */
function buildDmpManagerFilters(
  baseFilter: Prisma.BookingRequestWhereInput,
  status?: string | null
): Prisma.BookingRequestWhereInput {
  const filter = { ...baseFilter };

  // Если запрошен конкретный статус запроса, не фильтруем по статусу бронирований
  if (!status) {
    // Если статус не указан, показываем запросы с бронированиями KM_APPROVED или запросы со статусом CLOSED
    filter.OR = [
      {
        bookings: {
          some: {
            status: "KM_APPROVED"
          }
        }
      },
      { status: "CLOSED" }
    ];
  }

  return filter;
}