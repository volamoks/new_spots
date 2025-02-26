# Практические советы по улучшению кода в проекте StoreSpotsBooking

## 1. Основные принципы для MVP

В MVP не обязательно следовать всем принципам SOLID, но есть базовые правила, которые помогут сделать код более поддерживаемым:

### 1.1 DRY (Don't Repeat Yourself)
- Избегайте дублирования кода, выделяйте повторяющиеся части в отдельные функции
- Создавайте переиспользуемые компоненты и хуки

### 1.2 Разделение бизнес-логики и представления
- Отделите логику от UI-компонентов
- Создавайте отдельные файлы для бизнес-логики

### 1.3 Простой и понятный код
- Используйте говорящие имена переменных и функций
- Пишите комментарии для сложных участков кода
- Придерживайтесь единого стиля форматирования

## 2. Конкретные проблемы и их решения

### 2.1 Смешивание бизнес-логики и API-маршрутов

**Проблема:**
В API-маршрутах (например, `app/api/bookings/route.ts`) содержится и обработка HTTP-запросов, и бизнес-логика.

**Решение:**
Выделите бизнес-логику в отдельные сервисные функции:

```typescript
// lib/services/bookingService.ts
export async function createBookingRequest(userId: string, zoneIds: string[], userRole: string, userCategory?: string) {
  // Создание запроса
  const bookingRequest = await prisma.bookingRequest.create({
    data: {
      userId,
      status: "NEW",
      category: userRole === "CATEGORY_MANAGER" ? userCategory : undefined,
    },
  });

  // Создание бронирований
  const bookings = [];
  for (const zoneId of zoneIds) {
    const zone = await prisma.zone.findUnique({
      where: { uniqueIdentifier: zoneId },
    });

    if (!zone) continue;

    const booking = await prisma.booking.create({
      data: {
        bookingRequestId: bookingRequest.id,
        zoneId: zone.id,
        status: "PENDING_KM",
      },
    });
    bookings.push(booking);
  }

  return { bookingRequest, bookings };
}

// app/api/bookings/route.ts
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zoneIds } = await req.json();
    if (!zoneIds || zoneIds.length === 0) {
      return NextResponse.json(
        { error: "No zones specified for booking" },
        { status: 400 },
      );
    }

    // Вызов сервисной функции вместо внутренней логики
    const result = await createBookingRequest(
      session.user.id,
      Array.isArray(zoneIds) ? zoneIds : [zoneIds],
      session.user.role,
      session.user.category
    );

    return NextResponse.json(result);
  } catch (error) {
    // Обработка ошибок
  }
}
```

### 2.2 Дублирование кода обработки ошибок

**Проблема:**
Почти в каждом API-маршруте повторяется один и тот же шаблон try-catch для обработки ошибок.

**Решение:**
Создайте переиспользуемую функцию для обработки ошибок:

```typescript
// lib/utils/api.ts
export function handleApiError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
  console.error("[API Error]:", error);
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

// Использование в API:
export async function GET(req: Request) {
  try {
    // Код API-маршрута
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2.3 Отключение проверки типов

**Проблема:**
В `lib/stores/bookingStore.ts` используется `// @ts-nocheck`, что говорит о проблемах с типизацией.

**Решение:**
Вместо отключения проверки типов для всего файла, используйте более точечные решения:

1. Исправьте типы данных
2. Если нужно игнорировать проверку для конкретной строки, используйте `// @ts-ignore` с комментарием
3. Создайте отдельные интерфейсы для сложных структур

```typescript
// Пример исправления типизации в store
interface Booking {
  id: string;
  status: string;
  // другие поля
}

// Используйте более конкретные типы вместо any
function transformBookingsData(data: any[]): Booking[] {
  // преобразование данных
}
```

### 2.4 Сложные условия фильтрации в API

**Проблема:**
В `app/api/bookings/route.ts` очень сложные условия построения фильтров для запросов в зависимости от роли.

**Решение:**
Выделите логику фильтрации в отдельные функции:

```typescript
// lib/utils/filters.ts
export function buildBookingFilters(role: string, status?: string, category?: string) {
  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  switch (role) {
    case "SUPPLIER":
      return { ...whereClause, userId: session.user.id };
    
    case "CATEGORY_MANAGER":
      return buildCategoryManagerFilters(whereClause, status, category);
    
    case "DMP_MANAGER":
      return buildDmpManagerFilters(whereClause, status);
    
    default:
      throw new Error("Invalid user role");
  }
}

function buildCategoryManagerFilters(baseFilter: any, status?: string, category?: string) {
  // Логика построения фильтров для КМ
}

// Использование в API
const filter = buildBookingFilters(session.user.role, status, session.user.category);
const bookingRequests = await prisma.bookingRequest.findMany({
  where: filter,
  // остальные параметры
});
```

### 2.5 Прямое использование Prisma в разных частях кода

**Проблема:**
Prisma клиент используется напрямую в разных файлах, что затрудняет тестирование и поддержку.

**Решение:**
Создайте простой слой доступа к данным в виде функций:

```typescript
// lib/data/bookings.ts
import { prisma } from "../prisma";

export async function getBookingsByUserId(userId: string) {
  return prisma.bookingRequest.findMany({
    where: { userId },
    include: { bookings: { include: { zone: true } } }
  });
}

export async function updateBookingStatus(bookingId: string, status: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status }
  });
}

// Использование в сервисах или API
import { getBookingsByUserId } from "@/lib/data/bookings";

const bookings = await getBookingsByUserId(session.user.id);
```

## 3. Улучшение пользовательского опыта

### 3.1 Перенаправление авторизованных пользователей

**Проблема:**
Авторизованные пользователи видят стартовую страницу с кнопками логина и регистрации.

**Решение:**
Добавьте перенаправление в middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Если пользователь на главной странице и уже авторизован
  if (request.nextUrl.pathname === '/' && token) {
    const role = token.role as string;
    
    // Перенаправление в зависимости от роли
    switch (role) {
      case 'SUPPLIER':
        return NextResponse.redirect(new URL('/supplier/bookings', request.url));
      case 'CATEGORY_MANAGER':
        return NextResponse.redirect(new URL('/category-manager', request.url));
      case 'DMP_MANAGER':
        return NextResponse.redirect(new URL('/dmp-manager', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register'],
};
```

### 3.2 Улучшение компонентов

**Проблема:**
Компоненты содержат и логику, и представление.

**Решение:**
Создайте простые hooks для логики:

```typescript
// hooks/useBookings.ts
export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { bookings, isLoading, error, fetchBookings };
}

// В компоненте
function BookingPage() {
  const { bookings, isLoading, error, fetchBookings } = useBookings();
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  return (
    <div>
      {isLoading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      <BookingList bookings={bookings} />
    </div>
  );
}
```

## 4. Идеи для дальнейших улучшений

### 4.1 Упрощение работы с глобальным состоянием

- Разделите большой store на несколько маленьких по функциональности
- Используйте селекторы для доступа к частям состояния
- Добавьте типизацию для более надежного кода

### 4.2 Добавление загрузочных состояний

- Добавьте индикаторы загрузки для действий, которые требуют обращения к серверу
- Предоставляйте пользователям обратную связь о статусе операций

### 4.3 Централизованная обработка ошибок

- Создайте компонент для отображения ошибок
- Реализуйте единый механизм отображения сообщений об ошибках

### 4.4 Функциональные улучшения

- **Календарь бронирований**: Добавьте визуальное представление в виде календаря
- **Экспорт данных**: Возможность выгрузки отчетов в Excel или PDF
- **Системные уведомления**: Оповещения о важных событиях в системе
- **Мобильная версия**: Адаптивный дизайн для всех страниц
- **Расширенные фильтры**: Улучшенная система фильтрации для бронирований и зон

## 5. Техническая задолженность

Отслеживайте техническую задолженность, ведите список того, что нужно будет улучшить в будущем:

1. Добавить тесты
2. Улучшить типизацию в проблемных местах
3. Оптимизировать запросы к базе данных
4. Внедрить кэширование для частых запросов
5. Реализовать мониторинг ошибок

## Заключение

Следуя этим рекомендациям, вы сможете улучшить качество кода без излишнего усложнения архитектуры. Для MVP важнее иметь работающий продукт с понятным и поддерживаемым кодом, чем идеальную архитектуру.