'use client';

import React, { useCallback, useState } from 'react'; // Added useState
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react'; // Added Loader2
// import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Removed
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import consolidated hook
import { useCreateBooking } from '@/lib/hooks/useCreateBooking'; // Import the booking hook
import { ConfirmationModal } from '../ui/ConfirmationModal'; // Corrected relative import path

interface ZoneSelectionActionsPanelProps {
    // selectedZonesCount is still useful for display even if IDs are in store
    selectedZonesCount: number;
    // Props related to the supplier dropdown (managed locally in ZonesTable)
    selectedSupplier: string | null;
    onSelectSupplier?: (supplierId: string) => void;
    // onCreateBooking: () => Promise<void>; // REMOVED
}

export function ZoneSelectionActionsPanel({
    selectedZonesCount,
    selectedSupplier,
    onSelectSupplier,
}: ZoneSelectionActionsPanelProps) {
    const { data: session } = useSession();
    const {
        isLoading: isStoreLoading, // Renamed to avoid conflict
        uniqueFilterValues,
        selectedZoneIds, // Get selected IDs directly from the store
        clearSelection, // Assuming this action exists to clear selection
    } = useRoleData((session?.user?.role as 'dmp' | 'supplier' | 'categoryManager') || 'supplier'); // Use consolidated hook, provide role dynamically, default/fallback needed

    // Setup the booking hook
    // Note: useCreateBooking might need refactoring if it relies on the removed stores/hooks
    // For now, assume it uses useBookingActionsStore correctly.
    // The clearSelection call might need adjustment if the action name changes in useRoleData
    const handleBookingSuccess = useCallback(() => {
        if (clearSelection) {
            clearSelection(); // Clear selection in the store on success
        } else {
            console.warn('clearSelection action not found in useDmpManagerZones store');
        }
    }, [clearSelection]); // Dependency remains clearSelection from the hook

    const { createBooking, isBookingLoading } = useCreateBooking({
        onSuccess: handleBookingSuccess,
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // --- Derive roles and data ---
    const userRole = session?.user?.role;
    const userId = session?.user?.id; // Get user ID for the booking call
    const isSupplier = userRole === 'SUPPLIER';
    const isCategoryManager = userRole === 'CATEGORY_MANAGER';
    const uniqueSuppliers = uniqueFilterValues?.suppliers || [];

    // Handler to OPEN the confirmation modal
    const handleCreateBookingClick = () => {
        // Basic validation before opening modal
        if (selectedZoneIds.size === 0) {
            // Consider adding a toast here if needed, though button is disabled
            console.warn('No zones selected for booking.');
            return;
        }
        if (isCategoryManager && !selectedSupplier) {
            console.warn('Category Manager must select a supplier.');
            // Consider adding a toast here if needed, though button is disabled
            return;
        }
        setIsConfirmModalOpen(true); // Open the modal
    };

    // Handler to CONFIRM and execute the booking
    const confirmAndCreateBooking = () => {
        setIsConfirmModalOpen(false); // Close modal first
        // Pass selected IDs from the store and the user ID
        createBooking(Array.from(selectedZoneIds), userId);
    };

    // Don't render if nothing is selected
    if (selectedZonesCount === 0) {
        return null;
    }

    // Wrap return in a Fragment to allow multiple top-level elements
    return (
        <>
            <div className="bg-primary-50 p-4 rounded-md mb-4 border border-primary-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="font-medium">Выбрано зон: {selectedZonesCount}</p>
                        <p className="text-sm text-gray-500">
                            {isSupplier
                                ? 'Выберите зоны для создания заявки на бронирование'
                                : 'Выберите зоны и поставщика для создания заявки на бронирование'}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                        {isCategoryManager && (
                            <Select
                                value={selectedSupplier || ''}
                                onValueChange={value => onSelectSupplier && onSelectSupplier(value)}
                                // Disable if store is loading OR booking is in progress
                                disabled={isStoreLoading || isBookingLoading}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Выберите поставщика" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueSuppliers.map(supplier => (
                                        <SelectItem
                                            key={supplier}
                                            value={supplier}
                                        >
                                            {supplier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Button
                            onClick={handleCreateBookingClick} // Use the new internal handler
                            disabled={
                                selectedZonesCount === 0 ||
                                isStoreLoading || // Disable if store is loading
                                isBookingLoading || // Disable if booking is loading
                                (isCategoryManager && !selectedSupplier)
                            }
                        >
                            {isBookingLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Loading indicator
                            ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            {isBookingLoading ? 'Создание...' : 'Создать бронирование'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAndCreateBooking}
                title="Подтверждение бронирования"
                description={
                    <>
                        Вы уверены, что хотите создать заявку на бронирование для{' '}
                        <strong>{selectedZonesCount}</strong> выбранных зон?
                        {isCategoryManager && selectedSupplier && (
                            <>
                                {' '}
                                у поставщика <strong>{selectedSupplier}</strong>
                            </>
                        )}
                        .
                    </>
                }
                confirmText="Создать заявку"
                cancelText="Отмена"
            />
        </>
    ); // Close Fragment
}
