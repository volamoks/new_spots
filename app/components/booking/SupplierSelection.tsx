import { useEffect, useState } from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { Supplier } from '@/types/supplier';

const SupplierSelection = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const setSelectedSupplierInn = useBookingStore((state) => state.setSelectedSupplierInn);
  const selectedSupplierInn = useBookingStore((state) => state.selectedSupplierInn);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers');
        if (!response.ok) {
          throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
        }
        const data = await response.json();
        setSuppliers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSupplierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSupplierInn(event.target.value);
  };

  if (loading) {
    return <div>Loading suppliers...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <label htmlFor="supplier-select">Select Supplier:</label>
      <select
        id="supplier-select"
        value={selectedSupplierInn || ''}
        onChange={handleSupplierChange}
      >
        <option value="">-- Select a Supplier --</option>
        {suppliers.map((supplier) => (
          <option key={supplier.inn} value={supplier.inn}>
            {supplier.name} (INN: {supplier.inn})
          </option>
        ))}
      </select>
    </div>
  );
};

export default SupplierSelection;
