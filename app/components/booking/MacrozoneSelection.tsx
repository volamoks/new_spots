import { useMemo } from 'react'; // Removed useState, useEffect
// import { useFilterStore } from '@/lib/stores/filterStore'; // Removed old store import
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // Import new store
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown';

interface Props {
    selectedCategory: string;
}

export default function MacrozoneSelection({ selectedCategory }: Props) {
    // Get state and actions from the booking request store
    const { filterCriteria, setFilterCriteria } = useBookingRequestStore();
    const selectedMacrozones = filterCriteria.macrozone || []; // Get selected from store

    // Removed local state: const [selectedMacrozones, setSelectedMacrozones] = useState<string[]>(macrozoneFilters);

    const macrozones = useMemo(() => {
        return getCorrespondingMacrozones(selectedCategory);
    }, [selectedCategory]);

    const options = useMemo(() => {
        return macrozones.map(macrozone => ({
            value: macrozone,
            label: macrozone,
        }));
    }, [macrozones]);

    // Removed useEffect for syncing local state with store

    return (
        <UniversalDropdown
            mode="multiple"
            title="Select Macrozone" // Optional title context
            options={options}
            selected={selectedMacrozones}
            onChange={newValue => {
                // Type check for multiple mode
                if (Array.isArray(newValue)) {
                    setFilterCriteria({ macrozone: newValue }); // Correctly update store
                }
            }}
            triggerPlaceholder="Выберите Макрозоны"
            placeholder="Поиск макрозон..."
            // className="w-full" // Add if needed
        />
    );
}
