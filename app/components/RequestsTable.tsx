'use client';

import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // Import new store
import { BookingTable } from './booking/BookingTable';
import BookingRole from '@/lib/enums/BookingRole';

// Import type from new store
import { BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';
import { useAuth } from '@/lib/hooks/useAuth';

type RequestsTableProps = {
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
    // role: 'КМ' | 'ДМП' | 'Поставщик';
    bookings?: BookingRequestWithBookings[]; // Добавляем пропс для передачи бронирований
};

// const {user.role} = useSession();

const allColumns = [
    'ID',
    'Город',
    '№',
    'Маркет',
    'Новый формат',
    'Оборудование',
    'Габариты',
    'Основная Макрозона',
    'Смежная макрозона',
    'Бренд', // Add Brand here
    'Статус',
    'Действия',
];
export function RequestsTable({ onApprove, onReject, bookings }: RequestsTableProps) {
    // Используем переданные бронирования или получаем их из bookingRequestStore как запасной вариант
    const { bookingRequests: storeBookings } = useBookingRequestStore(); // Use the new state property 'bookingRequests'
    // const [visibleColumns, setVisibleColumns] = useState(allColumns); // Removed state for column visibility
    const { user } = useAuth();

    // Используем переданные бронирования, если они есть, иначе используем бронирования из стора
    // Используем переданные бронирования, если они есть, иначе используем бронирования из стора
    const displayBookings = bookings || storeBookings; // Use the data from props or the current page data from store

    if (!user) {
        return null; // or a loading state
    }
    const userRole =
        user.role === 'CATEGORY_MANAGER'
            ? BookingRole.KM
            : user.role === 'DMP_MANAGER'
            ? BookingRole.DMP
            : BookingRole.SUPPLIER;

    // Removed handleColumnToggle function

    return (
        <div>
            <div className="flex justify-end mb-4">{/* ColumnSelector removed */}</div>
            <BookingTable
                requests={displayBookings} // Pass the correct variable
                visibleColumns={allColumns} // Pass all columns since selector is removed
                userRole={userRole}
                onApprove={onApprove}
                onReject={onReject}
            />
        </div>
    );
}
