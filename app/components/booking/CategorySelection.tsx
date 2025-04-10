import React, { useMemo } from 'react';
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown';
// import { categoryData } from '@/lib/filterData'; // Replaced with kmCategories
import { CATEGORIES } from '@/lib/constants/kmCategories'; // Import our new categories

interface CategorySelectionProps {
    onCategorySelect: (category: string) => void;
    selectedCategory: string;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
    onCategorySelect,
    selectedCategory,
}) => {
    const categories = useMemo(() => {
        // Map CATEGORIES to the format needed by UniversalDropdown
        // Map CATEGORIES to the format needed by UniversalDropdown
        // Use category code for the value and name for the label
        return CATEGORIES.map(item => ({
            value: item.code, // Use code as the value
            label: item.name, // Use name as the display label
        }));
    }, []);

    return (
        <div className="w-full max-w mb-6">
            <label className="block text-m font-medium mb-2 mt-4">Выберите Категорию</label>
            <UniversalDropdown
                mode="single"
                title="Выбранная категория" // Optional title context
                options={categories}
                selected={selectedCategory}
                onChange={newValue => {
                    // Type check for single mode
                    if (typeof newValue === 'string' || newValue === null) {
                        // Original onChange expects string, handle null if necessary
                        onCategorySelect(newValue ?? ''); // Pass empty string if null, adjust if needed
                    }
                }}
                triggerPlaceholder="Выберите Категорию"
                placeholder="Поиск категории..."
                className="w-full"
                clearSelectionText="-- Не выбрано --" // Optional
            />
        </div>
    );
};

export default CategorySelection;
