'use client';

import React from 'react';
import { useBookingActionsStore, SimplifiedUser } from '@/lib/stores/bookingActionsStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Import the global loader store
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { useToast } from '@/components/ui/use-toast';

// useLoader is removed

const CreateBookingActions = () => {
    const { toast } = useToast();
    const {
        createBookingRequest,
        selectedZonesForCreation,
        // isCreating, // Removed - use global isLoading
        createError,
    } = useBookingActionsStore();
    const { fetchZones, isLoading: isZonesLoading } = useZonesStore();
    const { data: session } = useSession();
    const { isLoading } = useLoaderStore(); // Get global loading state

    const handleCreateBooking = async () => {
        // Use selectedZonesForCreation from the new store
        if (selectedZonesForCreation.size === 0 || !session?.user) return;

        try {
            // Convert session.user to SimplifiedUser (ensure type compatibility)
            // The SimplifiedUser type might need adjustment based on what createBookingRequest expects
            const simplifiedUser: SimplifiedUser = {
                id: session.user.id,
                // Assuming session.user.role is compatible with the Role enum used in SimplifiedUser
                // If not, mapping might be required.
                role: session.user.role as Role, // Use the imported Role enum for casting
                // category: session.user.category, // Include if needed by the store/API
            };

            // The supplier INN should be managed by useBookingActionsStore.
            // This component now only triggers the action.
            // The selectedSupplierInnForCreation state in the store should be set elsewhere (e.g., a supplier selection component).

            // Remove manual setLoading calls. createBookingRequest uses the loaderStore internally.
            const success = await createBookingRequest(simplifiedUser);

            if (success) {
                // Success toast is now handled by the store action
                console.log('Booking request created successfully.');
            } else {
                // Error handling is done within the store, but you can add component-specific feedback here
                // The createError state can be used to display errors (see JSX update later)
                console.error('Failed to create booking request.');
                // Optionally show an error toast here if the store doesn't already handle it sufficiently
                // toast({
                //     title: 'Ошибка',
                //     description: createError || 'Не удалось создать заявку.',
                //     variant: 'destructive',
                // });
            }
            // Remove clearSelectedZones(); it's handled internally by the store on success.
        } catch (error) {
            // Catch unexpected errors during the component's execution, though store errors are handled internally
            console.error('Ошибка при вызове createBookingRequest:', error);
            toast({
                title: 'Ошибка',
                description: 'Произошла непредвиденная ошибка при создании заявки.',
                variant: 'destructive',
            });
        }
    };

    const handleRefresh = async () => {
        try {
            // Remove manual setLoading. fetchZones should handle its own loading state via useZonesStore/loaderStore.
            await fetchZones(); // Call the action from the new zones store
        } catch (error) {
            // Catch unexpected errors during the component's execution
            console.error('Ошибка при вызове fetchZones:', error);
        }
        // Remove finally block with setLoading(false)
    };

    return (
        <div className="flex flex-col items-start gap-2 m-6">
            {' '}
            {/* Changed to flex-col for error message */}
            <div className="flex gap-2">
                {' '}
                {/* Keep buttons in a row */}
                <Button
                    onClick={handleRefresh}
                    // Disable if zones are loading OR a global action is in progress
                    disabled={isZonesLoading || isLoading}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить
                </Button>
                <Button
                    onClick={handleCreateBooking}
                    // Disable if zones are loading OR a global action is in progress OR no zones are selected
                    disabled={isZonesLoading || isLoading || selectedZonesForCreation.size === 0}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                >
                    {/* Use selectedZonesForCreation.size */}
                    Создать бронирование ({selectedZonesForCreation.size})
                </Button>
            </div>
            {/* Optionally display creation error */}
            {createError && <p className="text-sm text-red-600 mt-1">Ошибка: {createError}</p>}
        </div>
    );
};

export default CreateBookingActions;
