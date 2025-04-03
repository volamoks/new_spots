import { useMemo } from 'react'; // Removed useState, useEffect
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // Import new store
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown';

interface Props {
    selectedCategory: string;
}

export default function MacrozoneSelection({ selectedCategory }: Props) {
    const { filterCriteria, setFilterCriteria } = useBookingRequestStore();
    const selectedMacrozones = filterCriteria.macrozone || []; // Get selected from store

    const macrozones = useMemo(() => {
        return getCorrespondingMacrozones(selectedCategory);
    }, [selectedCategory]);

    const options = useMemo(() => {
        return macrozones.map(macrozone => ({
            value: macrozone,
            label: macrozone,
        }));
    }, [macrozones]);

    return (
        <UniversalDropdown
            mode="multiple"
            title="Select Macrozone" // Optional title context
            options={options}
            selected={selectedMacrozones}
            onChange={newValue => {
                if (Array.isArray(newValue)) {
                    setFilterCriteria({ macrozone: newValue }); // Correctly update store
                }
            }}
            triggerPlaceholder="Выберите Макрозоны"
            placeholder="Поиск макрозон..."
        />
    );
}
