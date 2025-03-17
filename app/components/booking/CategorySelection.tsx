import React, { useMemo } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
        return categoryData.map(item => item.category);
    }, []);

    return (
        <div className="w-full max-w-sm mb-6">
            <label className="block text-m font-medium mb-2 mt-4">Выберите Категорию</label>
            <Select
                value={selectedCategory}
                onValueChange={onCategorySelect}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Категория товара" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((category: string) => (
                        <SelectItem
                            key={category}
                            value={category}
                        >
                            {category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default CategorySelection;
