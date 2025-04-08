'use client';

import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Zone, ZoneStatus } from '@/types/zone';
import { useLoaderStore } from '@/lib/stores/loaderStore';
import { useToast } from '@/components/ui/use-toast';
import { updateZoneStatus, deleteZone } from '@/lib/services/zoneService';
import { ConfirmationModal } from '@/app/components/ui/ConfirmationModal'; // Import ConfirmationModal

interface ZoneManagementTableRowProps {
    zone: Zone;
    onRefresh: () => void; // Add onRefresh prop
}

// Helper function to get display text for status
const getStatusDisplay = (status: ZoneStatus | string): string => {
    const statusMap: Record<string, string> = {
        [ZoneStatus.AVAILABLE]: 'Доступна',
        [ZoneStatus.BOOKED]: 'Забронирована',
        [ZoneStatus.UNAVAILABLE]: 'Недоступна',
    };
    return statusMap[status] || String(status);
};

// Helper function to get CSS classes for status badge
const getStatusClass = (status: ZoneStatus | string): string => {
    switch (status) {
        case ZoneStatus.AVAILABLE:
        case 'AVAILABLE':
            return 'bg-green-100 text-green-800 border-green-300';
        case ZoneStatus.BOOKED:
        case 'BOOKED':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case ZoneStatus.UNAVAILABLE:
        case 'UNAVAILABLE':
            return 'bg-red-100 text-red-800 border-red-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

export function ZoneManagementTableRow({
    zone,
    onRefresh, // Destructure onRefresh from props
}: ZoneManagementTableRowProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { withLoading } = useLoaderStore();
    const { toast } = useToast();
    // State for Confirmation Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        description: '',
        onConfirm: () => {},
        confirmText: 'Confirm',
        confirmVariant: 'default' as 'default' | 'destructive',
    });
    const currentStatus = zone.status;

    const handleStatusChange = async (newStatus: ZoneStatus) => {
        if (currentStatus === newStatus || isProcessing) {
            return;
        }
        setIsProcessing(true);

        try {
            await withLoading(updateZoneStatus(zone.id, newStatus), 'Обновление статуса зоны...');
            toast({
                title: 'Статус обновлен',
                description: `Статус зоны ${zone.uniqueIdentifier} успешно изменен на ${newStatus}`,
                variant: 'default',
            });
            onRefresh(); // Use prop function
        } catch (error) {
            toast({
                title: 'Ошибка',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Произошла ошибка при обновлении статуса',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Internal handler for deleting a zone
    const handleDelete = async () => {
        if (isProcessing) return;

        // Open confirmation modal instead of window.confirm
        setModalConfig({
            title: 'Подтвердите удаление',
            description: `Вы уверены, что хотите удалить зону "${zone.uniqueIdentifier}"? Это действие необратимо.`,
            onConfirm: handleDeleteConfirm, // Call the actual delete logic on confirm
            confirmText: 'Удалить',
            confirmVariant: 'destructive',
        });
        setIsModalOpen(true);
    };

    // Actual delete logic, called by the modal's onConfirm
    const handleDeleteConfirm = async () => {
        setIsModalOpen(false); // Close modal first
        if (isProcessing) return; // Check processing state again just in case

        setIsProcessing(true);

        try {
            await withLoading(
                deleteZone(zone.id, zone.uniqueIdentifier),
                `Удаление зоны "${zone.uniqueIdentifier}"...`,
            );
            toast({
                title: 'Зона удалена',
                description: `Зона "${zone.uniqueIdentifier}" успешно удалена.`,
                variant: 'default',
            });
            onRefresh(); // Use prop function
        } catch (error) {
            toast({
                title: 'Ошибка удаления',
                description:
                    error instanceof Error
                        ? error.message
                        : `Произошла ошибка при удалении зоны "${zone.uniqueIdentifier}"`,
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.uniqueIdentifier}</TableCell>
                <TableCell>{zone.city}</TableCell>
                <TableCell>{zone.market}</TableCell>
                <TableCell>{zone.mainMacrozone}</TableCell>
                <TableCell>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(
                            currentStatus,
                        )}`}
                    >
                        {getStatusDisplay(currentStatus)}
                    </span>
                </TableCell>
                {/* Cell for status change buttons */}
                <TableCell>
                    <div className="flex flex-col space-y-1 w-28">
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.AVAILABLE)}
                            disabled={currentStatus === 'AVAILABLE' || isProcessing}
                            className={`text-xs px-2 py-1 rounded ${
                                currentStatus === 'AVAILABLE'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50'
                            }`}
                        >
                            Доступна
                        </button>
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.BOOKED)}
                            disabled={currentStatus === 'BOOKED' || isProcessing}
                            className={`text-xs px-2 py-1 rounded ${
                                currentStatus === 'BOOKED'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50'
                            }`}
                        >
                            Забронирована
                        </button>
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.UNAVAILABLE)}
                            disabled={currentStatus === 'UNAVAILABLE' || isProcessing}
                            className={`text-xs px-2 py-1 rounded ${
                                currentStatus === 'UNAVAILABLE'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50'
                            }`}
                        >
                            Недоступна
                        </button>
                    </div>
                </TableCell>
                {/* Cell for delete button */}
                <TableCell>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isProcessing}
                        aria-label={`Удалить зону ${zone.uniqueIdentifier}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
            </TableRow>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                description={modalConfig.description}
                confirmText={modalConfig.confirmText}
                confirmVariant={modalConfig.confirmVariant}
                cancelText="Отмена"
            />
        </>
    );
}
