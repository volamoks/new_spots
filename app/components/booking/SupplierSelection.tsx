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
    const { suppliers, isLoading, error, fetchSuppliers } = useSupplierStore();
    // Get state and action for selection from the booking actions store
    const { selectedSupplierInnForCreation, setSelectedSupplierInnForCreation } = useBookingActionsStore();

    // Fetch suppliers on component mount
    useEffect(() => {
        // Fetch only if suppliers haven't been loaded yet
        if (suppliers.length === 0) {
            fetchSuppliers();
        }
    }, [fetchSuppliers, suppliers.length]);

    if (isLoading) {
        return <div className="text-sm text-gray-500">Loading suppliers...</div>;
    }

    if (error) {
        return <div className="text-sm text-red-500">Error loading suppliers: {error}</div>;
    }

    // Map suppliers from the store to options for the dropdown
    // Assumes supplier object in store has 'inn' and 'name'
    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.inn, // Use INN as the value
        label: supplier.name, // Use name as the label
    }));

    return (
        <div className="space-y-2">
            <label className="block text-m font-medium pt-4">Выберите поставщика</label>
            <SimpleSelectDropdown
                title="Выбранный поставщик"
                options={supplierOptions}
                selected={selectedSupplierInnForCreation || ''} // Use state from bookingActionsStore
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
