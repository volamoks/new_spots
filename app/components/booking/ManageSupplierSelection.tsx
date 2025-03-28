import { useEffect } from 'react';
// Import the new stores
import { useSupplierStore } from '@/lib/stores/supplierStore';
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // For filtering
// Keep the dropdown component
import { SimpleSelectDropdown } from '@/app/components/booking/SimpleSelectDropdown';
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
            <SimpleSelectDropdown
                title="Выбранный поставщик"
                options={supplierOptions}
                selected={selectedSupplierInn || ''} // Use state from bookingRequestStore filterCriteria
                onChange={handleSupplierChange} // Use local handler to update filterCriteria
                placeholder="Select a supplier"
                className="w-full"
                // noValueOption prop removed as it's not supported by SimpleSelectDropdown
            />
        </div>
    );
};

export default ManageSupplierSelection;
