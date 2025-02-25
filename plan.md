# План реализации флоу подтверждения бронирований

## Задача

Реализовать флоу подтверждения бронирований с использованием единого компонента `RequestsTable`.

Флоу:

1.  Поставщик (Supplier) создает запрос с несколькими бронированиями.
2.  Категорийный менеджер (КМ) видит запрос и может подтвердить или отклонить каждое бронирование. Статус запроса меняется с "новый" на "закрытый".
3.  ДМП менеджер видит запрос, но может подтвердить только те бронирования, которые были подтверждены КМ.

## Модель данных (Prisma)

*   **BookingRequest**:
    *   `id`: string (UUID)
    *   `userId`: string (ID пользователя-поставщика)
    *   `status`: enum ("NEW", "CLOSED")
    *   `category`: string | null (категория, если запрос от КМ)
    *   `createdAt`: DateTime
    *   `updatedAt`: DateTime
    *   `user`: User (связь с пользователем)
    *   `bookings`: Booking\[] (связь с бронированиями)
*   **Booking**:
    *   `id`: string (UUID)
    *   `bookingRequestId`: string (ID запроса)
    *   `zoneId`: string (ID зоны)
    *   `status`: enum ("PENDING_KM", "KM_APPROVED", "KM_REJECTED", "DMP_APPROVED", "DMP_REJECTED")
    *   `createdAt`: DateTime
    *   `updatedAt`: DateTime
    *   `bookingRequest`: BookingRequest (связь с запросом)
    *   `zone`: Zone (связь с зоной)

## Реализация

### 1. Категорийный менеджер (КМ) (`app/category-manager/page.tsx`)

*   Использовать компонент `RequestsTable`.
*   Получать данные с помощью функции `getBookings` (уже фильтрует запросы по роли пользователя, для КМ - PENDING_KM).
*   Передать в `RequestsTable` пропсы:
    *   `role="CATEGORY_MANAGER"`
    *   `onApprove`: функция, делающая PATCH-запрос к `/api/bookings/{requestId}` с телом `{ action: "approve-km", bookingId: ... }`.
    *   `onReject`: функция, делающая PATCH-запрос к `/api/bookings/{requestId}` с телом `{ action: "reject-km", bookingId: ... }`.
    *   `onRequestStatusChange`: функция, вызываемая, когда все бронирования в запросе получают статус KM_APPROVED/KM_REJECTED, меняет статус запроса на "CLOSED".

### 2. ДМП менеджер (`app/dmp-manager/page.tsx`)

*   Уже реализовано.

### 3. Поставщик (Supplier) (`app/supplier/page.tsx`)

*   Добавить форму для создания запроса:
    *   Множественный выбор зон.
*   При отправке формы делать POST-запрос к `/api/bookings/` с телом `{ zoneIds: [...] }`.
*   Использовать `RequestsTable` для отображения запросов поставщика.
    *   Передать `role="SUPPLIER"`.

### 4. Компонент `RequestsTable`

*   Уже реализован и является универсальным.