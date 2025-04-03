import { useEffect } from 'react';
// Import the new stores
import { useSupplierStore } from '@/lib/stores/supplierStore';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
// Keep the dropdown component
import { SimpleSelectDropdown } from '@/app/components/booking/SimpleSelectDropdown';
// Remove unused Supplier type import if not needed elsewhere
// import { Supplier } from '@/types/supplier';

const SupplierSelection = () => {
    // Get state and actions from the supplier store
    const { suppliers, fetchSuppliers } = useSupplierStore(); // Removed unused isLoading and error
    // Get state and action for selection from the booking actions store
    const { selectedSupplierInnForCreation, setSelectedSupplierInnForCreation } =
        useBookingActionsStore();

    // Fetch suppliers on component mount
    useEffect(() => {
        // Fetch only if suppliers haven't been loaded yet
        if (suppliers.length === 0) {
            fetchSuppliers();
        }
    }, [fetchSuppliers, suppliers.length]);

    // Loading and error display are now handled by the global loader and toasts
    // The error state in the store can still be used for other logic if needed.

    // Map suppliers from the store to options for the dropdown
    // Assumes supplier object in store has 'inn' and 'name'
    const supplierOptions = suppliers.map(supplier => {
        if (!supplier || !supplier.name) {
            // --- DEBUG LOG ---
            // console.warn('Supplier missing name:', JSON.stringify(supplier)); // Keep commented out or remove later
            // --- END DEBUG LOG ---
            // Provide a default label if name is missing
            return { value: supplier?.inn || '', label: '[No Name]' };
        }
        // Ensure label is a string, even if name is somehow not (though TS should catch this)
        return { value: supplier.inn, label: String(supplier.name) };
    });

    // Find the label for the currently selected value
    const currentSelectedLabel = supplierOptions.find(
        option => option.value === selectedSupplierInnForCreation,
    )?.label;

    return (
        <div className="space-y-2">
            <label className="block text-m font-medium pt-4">Выберите Поставщика</label>
            <SimpleSelectDropdown
                title="Выбранный поставщик"
                options={supplierOptions}
                selected={selectedSupplierInnForCreation || ''} // Use state from bookingActionsStore
                selectedLabel={currentSelectedLabel} // Pass the found label
                onChange={setSelectedSupplierInnForCreation} // Use action from bookingActionsStore
                placeholder="Select a supplier"
                className="w-full"
                // Add a "no value" option if needed
                // noValueOption={{ value: '', label: 'Не выбрано' }}
            />
        </div>
    );
};

export default SupplierSelection;
