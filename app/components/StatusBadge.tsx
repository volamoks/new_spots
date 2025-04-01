import { cn } from '@/lib/utils';
import { BookingStatus, RequestStatus } from '@prisma/client';

type StatusBadgeProps = {
    status: BookingStatus | RequestStatus | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const statusStyles: Record<string, string> = {
        // Add index signature
        // Original Booking/Request Statuses
        NEW: 'bg-blue-100 text-blue-800', // Keep for potential direct use
        CLOSED: 'bg-gray-300 text-gray-800', // Keep for potential direct use
        PENDING_KM: 'bg-blue-100 text-blue-800',
        KM_APPROVED: 'bg-yellow-100 text-yellow-800',
        KM_REJECTED: 'bg-red-100 text-red-800',
        DMP_APPROVED: 'bg-green-100 text-green-800',
        DMP_REJECTED: 'bg-red-100 text-red-800',

        // New Request Header Statuses
        REQUEST_NEW: 'bg-blue-100 text-blue-800',
        REQUEST_PROCESSED_KM: 'bg-yellow-100 text-yellow-800',
        REQUEST_CLOSED: 'bg-gray-300 text-gray-800',
        REQUEST_EMPTY: 'bg-gray-100 text-gray-500',
        REQUEST_UNKNOWN: 'bg-gray-100 text-gray-500',

        // New Individual Booking Statuses (Supplier View)
        BOOKING_IN_PROGRESS: 'bg-blue-100 text-blue-800',
        BOOKING_APPROVED: 'bg-green-100 text-green-800',
        BOOKING_REJECTED: 'bg-red-100 text-red-800',
        BOOKING_UNKNOWN: 'bg-gray-100 text-gray-500',

        // Remove old supplier statuses if they are no longer used
        // IN_PROGRESS: 'bg-blue-100 text-blue-800',
        // IN_PROGRESS_DMP: 'bg-yellow-100 text-yellow-800',
    };

    const getStatusText = (status: BookingStatus | RequestStatus | string) => {
        switch (status) {
            // Original Booking/Request Statuses (Keep for potential direct use or KM/DMP view)
            case BookingStatus.PENDING_KM:
                return 'Ожидает КМ';
            case BookingStatus.KM_APPROVED:
                return 'Согласована КМ';
            case BookingStatus.KM_REJECTED:
                return 'Отклонена КМ';
            case BookingStatus.DMP_APPROVED:
                return 'Согласована ДМП';
            case BookingStatus.DMP_REJECTED:
                return 'Отклонена ДМП';
            case RequestStatus.NEW:
                return 'Новая'; // Original Request status
            case RequestStatus.CLOSED:
                return 'Закрыта'; // Original Request status

            // New Request Header Statuses
            case 'REQUEST_NEW':
                return 'Новая заявка';
            case 'REQUEST_PROCESSED_KM':
                return 'На согласовании'; // Changed text to be neutral
            case 'REQUEST_CLOSED':
                return 'Заявка закрыта';
            case 'REQUEST_EMPTY':
                return 'Пустая заявка';
            case 'REQUEST_UNKNOWN':
                return 'Неизвестный статус заявки';

            // New Individual Booking Statuses (Supplier View)
            case 'BOOKING_IN_PROGRESS':
                return 'В работе';
            case 'BOOKING_APPROVED':
                return 'Согласовано';
            case 'BOOKING_REJECTED':
                return 'Отклонено';
            case 'BOOKING_UNKNOWN':
                return 'Неизвестный статус брони';

            // Remove old supplier statuses if no longer used
            // case 'IN_PROGRESS': return 'В работе';
            // case 'IN_PROGRESS_DMP': return 'В работе у менеджера ДМП';

            default:
                console.warn(`StatusBadge: Unknown status value received: ${status}`);
                return 'Неизвестно';
        }
    };

    const statusText = getStatusText(status);
    const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'; // Default style

    return (
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', style)}>
            {statusText}
        </span>
    );
}
