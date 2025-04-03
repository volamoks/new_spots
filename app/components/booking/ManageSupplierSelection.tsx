import { useEffect } from 'react';
// Import the new stores
import { useSupplierStore } from '@/lib/stores/supplierStore';
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // For filtering
// Replaced SimpleSelectDropdown with UniversalDropdown
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown';
// Remove unused Supplier type import if not needed elsewhere
// import { Supplier } from '@/types/supplier';

const ManageSupplierSelection = () => {
    // Get state and actions from the supplier store
    const { suppliers, isLoading, error, fetchSuppliers } = useSupplierStore();
    // Get state and action for filtering from the booking request store
    const { filterCriteria, setFilterCriteria } = useBookingRequestStore();
    const selectedSupplierInn = filterCriteria.supplierInn; // Get selected INN from filter criteria

    // Fetch suppliers on component mount
    useEffect(() => {
        // Fetch only if suppliers haven't been loaded yet
        if (suppliers.length === 0) {
            fetchSuppliers();
        }
    }, [fetchSuppliers, suppliers.length]);

    // Handler to update the filter criteria in the store
    const handleSupplierChange = (inn: string | null) => {
        setFilterCriteria({ supplierInn: inn || undefined }); // Set to undefined if null/empty to clear filter
    };

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
        label: `${supplier.name} (INN: ${supplier.inn})`, // Display name and INN
    }));

    return (
        <div className="space-y-2">
            <label className="block text-m font-medium pt-4">Фильтр по поставщику</label>
            <UniversalDropdown
                mode="single"
                title="Выбранный поставщик" // Optional title context
                options={supplierOptions} // Pass options from store
                selected={selectedSupplierInn || null} // Pass selected value from filterCriteria (ensure null if undefined)
                onChange={newValue => {
                    // Type check for single mode before calling handler
                    if (typeof newValue === 'string' || newValue === null) {
                        handleSupplierChange(newValue);
                    }
                }}
                triggerPlaceholder="Фильтр по поставщику" // Placeholder for the button
                placeholder="Поиск поставщика..." // Placeholder for the search input
                className="w-full"
                isDisabled={isLoading} // Disable while suppliers are loading
                clearSelectionText="-- Все поставщики --" // Optional: Text for clearing selection
            />
        </div>
    );
};

export default ManageSupplierSelection;
