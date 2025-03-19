import { cn } from '@/lib/utils';
import { BookingStatus, RequestStatus } from '@prisma/client';

type StatusBadgeProps = {
    status: BookingStatus | RequestStatus | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const statusStyles = {
        NEW: 'bg-blue-100 text-blue-800',
        CLOSED: 'bg-gray-300 text-gray-800',
        PENDING_KM: 'bg-blue-100 text-blue-800',
        KM_APPROVED: 'bg-yellow-100 text-yellow-800',
        KM_REJECTED: 'bg-red-100 text-red-800',
        DMP_APPROVED: 'bg-green-100 text-green-800',
        DMP_REJECTED: 'bg-red-100 text-red-800',
    };

    const getStatusText = (status: BookingStatus | RequestStatus | string) => {
        switch (status) {
            case 'NEW':
                return 'Новая';
            case 'CLOSED':
                return 'Закрыта';
            case 'PENDING_KM':
                return 'Ожидает КМ';
            case 'KM_APPROVED':
                return 'Согласована КМ';
            case 'KM_REJECTED':
                return 'Отклонена КМ';
            case 'DMP_APPROVED':
                return 'Согласована ДМП';
            case 'DMP_REJECTED':
                return 'Отклонена ДМП';
            default:
                return 'Неизвестный статус';
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
