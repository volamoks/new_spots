import { useEffect, useState } from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { Supplier } from '@/types/supplier';
import { SimpleSelectDropdown } from '@/app/components/booking/SimpleSelectDropdown';

const ManageSupplierSelection = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const setSelectedSupplierInn = useBookingStore(state => state.setSelectedSupplierInn);
    const selectedSupplierInn = useBookingStore(state => state.selectedSupplierInn);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/suppliers', {
                    credentials: 'include',
                });

                if (response.status === 401) {
                    throw new Error('Please login to access suppliers');
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('Invalid suppliers data format');
                }

                setSuppliers(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading suppliers...</div>;
    }

    if (error) {
        return <div className="text-sm text-red-500">Error: {error}</div>;
    }

    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.inn,
        label: `${supplier.name} (INN: ${supplier.inn})`,
    }));

    return (
        <div className="space-y-2">
            <label className="block text-m font-medium  pt-4">Выберите поставщика</label>
            <SimpleSelectDropdown
                title="Выбранный поставщик"
                options={supplierOptions}
                selected={selectedSupplierInn || ''}
                onChange={setSelectedSupplierInn}
                placeholder="Select a supplier"
                className="w-full"
            />
        </div>
    );
};

export default ManageSupplierSelection;
