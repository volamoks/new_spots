import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { cn } from '@/lib/utils';
import { BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';
import { BookingStatus, RequestStatus } from '@prisma/client';

type RequestHeaderRowProps = {
    request: BookingRequestWithBookings;
    isExpanded: boolean;
    onToggleExpand: (requestId: string) => void;
    displayStatus: BookingStatus | RequestStatus | string;
    isClosed: boolean;
    formatDate: (date: Date | string | null | undefined) => string;
};

export const RequestHeaderRow: React.FC<RequestHeaderRowProps> = ({
    request,
    isExpanded,
    onToggleExpand,
    displayStatus,
    isClosed,
    formatDate,
}) => {
    return (
        <TableRow
            className={cn(
                'bg-gray-100 cursor-pointer',
                isClosed && 'opacity-60 bg-gray-200', // Apply gray out style if closed
            )}
            onClick={() => onToggleExpand(request.id)} // Allow clicking anywhere on the row to toggle
        >
            <TableCell colSpan={10} className="font-bold">
                <div className="flex items-center"> {/* Use items-center for vertical alignment */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row click when clicking button
                            onToggleExpand(request.id);
                        }}
                        aria-expanded={isExpanded} // Accessibility
                        aria-controls={`request-details-${request.id}`} // Accessibility
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                    <div className="ml-2"> {/* Add some margin */}
                        <div className="flex items-center space-x-2"> {/* Align label and badge */}
                            <label className="text-sm font-bold block text-gray-700">
                                Заявка N: {request.id.slice(-4)} от{' '}
                                {formatDate(request.createdAt)}
                            </label>
                            <StatusBadge status={displayStatus} />
                        </div>
                        <label className="text-sm font-normal block text-gray-600 mt-1"> {/* Make supplier slightly less prominent */}
                            Поставщик: {request.supplierName}
                        </label>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
};