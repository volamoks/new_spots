import React, { useMemo } from 'react';
import { SimpleSelectDropdown } from '@/app/components/booking/SimpleSelectDropdown';
import { categoryData } from '@/lib/filterData';

interface CategorySelectionProps {
    onCategorySelect: (category: string) => void;
    selectedCategory: string;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
    onCategorySelect,
    selectedCategory,
}) => {
    const categories = useMemo(() => {
        return categoryData.map(item => ({
            value: item.category,
            label: item.category,
        }));
    }, []);

    return (
        <div className="w-full max-w mb-6">
            <label className="block text-m font-medium mb-2 mt-4">Выберите Категорию</label>
            <SimpleSelectDropdown
                title="Выбранная категория"
                options={categories}
                selected={selectedCategory}
                onChange={onCategorySelect}
                placeholder="Категория товара"
                className="w-full"
            />
        </div>
    );
};

export default CategorySelection;
