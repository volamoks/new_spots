import { useEffect, useState } from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { Supplier } from '@/types/supplier';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const SupplierSelection = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const setSelectedSupplierInn = useBookingStore(state => state.setSelectedSupplierInn);
    const selectedSupplierInn = useBookingStore(state => state.selectedSupplierInn);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/suppliers');
                if (!response.ok) {
                    throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
                }
                const data = await response.json();
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

    return (
        <div className="space-y-2">
            <label className="block text-m font-medium  pt-4">Select Supplier:</label>
            <Select
                value={selectedSupplierInn || ''}
                onValueChange={setSelectedSupplierInn}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                    {suppliers.map(supplier => (
                        <SelectItem
                            key={supplier.inn}
                            value={supplier.inn}
                        >
                            {supplier.name} (INN: {supplier.inn})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default SupplierSelection;
