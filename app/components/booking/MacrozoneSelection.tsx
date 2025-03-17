import { useState, useMemo, useEffect } from 'react';
import { useFilterStore } from '@/lib/stores/filterStore';
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';

interface Props {
    selectedCategory: string;
}

export default function MacrozoneSelection({ selectedCategory }: Props) {
    const { macrozoneFilters, toggleFilter } = useFilterStore();
    const [selectedMacrozones, setSelectedMacrozones] = useState<string[]>(macrozoneFilters);

    const macrozones = useMemo(() => {
        return getCorrespondingMacrozones(selectedCategory);
    }, [selectedCategory]);

    const options = useMemo(() => {
        return macrozones.map(macrozone => ({
            value: macrozone,
            label: macrozone,
        }));
    }, [macrozones]);

    useEffect(() => {
        options.forEach(({ value }) => {
            const isSelected = selectedMacrozones.includes(value);
            const isInFilter = macrozoneFilters.includes(value);

            if (isSelected && !isInFilter) {
                toggleFilter('macrozone', value);
            } else if (!isSelected && isInFilter) {
                toggleFilter('macrozone', value);
            }
        });
    }, [selectedMacrozones, macrozoneFilters, toggleFilter, options]);

    return (
        <SimpleZoneFilterDropdown
            title="Select Macrozone"
            options={options}
            selected={selectedMacrozones}
            onChange={setSelectedMacrozones}
            placeholder="Search Macrozones..."
        />
    );
}
