'use client';

import React from 'react';
import { useBookingActionsStore, SimplifiedUser } from '@/lib/stores/bookingActionsStore'; // Import SimplifiedUser if needed here, or rely on session type
import { useZonesStore } from '@/lib/stores/zonesStore'; // Assuming this is the new zones store
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client'; // Import the Role enum
// useLoader is removed

const CreateBookingActions = () => {
    const {
        createBookingRequest,
        selectedZonesForCreation,
        // selectedSupplierInnForCreation, // Only needed if this component sets it
        isCreating,
        createError,
        // clearSelectedZonesForCreation, // Called internally by createBookingRequest on success
    } = useBookingActionsStore();
    const { fetchZones, isLoading: isZonesLoading } = useZonesStore(); // Assuming fetchZones and isLoading exist
    const { data: session } = useSession();
    // setLoading is removed

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
                // Optionally add success feedback (e.g., toast)
                console.log('Booking request created successfully.');
            } else {
                // Error handling is done within the store, but you can add component-specific feedback here
                // The createError state can be used to display errors (see JSX update later)
                console.error('Failed to create booking request.');
            }
            // Remove clearSelectedZones(); it's handled internally by the store on success.
        } catch (error) {
            // Catch unexpected errors during the component's execution, though store errors are handled internally
            console.error('Ошибка при вызове createBookingRequest:', error);
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
                    // Disable if zones are loading OR a booking is being created
                    disabled={isZonesLoading || isCreating}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить
                </Button>
                <Button
                    onClick={handleCreateBooking}
                    // Disable if zones are loading OR a booking is being created OR no zones are selected
                    disabled={isZonesLoading || isCreating || selectedZonesForCreation.size === 0}
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
