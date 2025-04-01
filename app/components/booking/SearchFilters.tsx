import React from 'react';
import { Input } from '@/components/ui/input';
import { Role } from '@prisma/client'; // Import Role enum

interface SearchFiltersProps {
    searchTerm: string | null | undefined;
    supplierName: string | null | undefined;
    isLoading: boolean;
    onSearchTermChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSupplierNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    userRole?: Role; // Add userRole prop
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
    searchTerm,
    supplierName,
    isLoading,
    onSearchTermChange,
    onSupplierNameChange,
    userRole, // Destructure userRole
}) => {
    // Determine if the supplier search should be shown
    const showSupplierSearch = userRole !== Role.SUPPLIER;

    return (
        // Adjust grid columns based on whether supplier search is shown
        <div className={`grid grid-cols-1 ${showSupplierSearch ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* Zone Parameters Search */}
            <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">
                    Поиск по параметрам зоны
                </label>
                <Input
                    type="text"
                    placeholder="Город, маркет, макрозона, оборудование..."
                    value={searchTerm || ''}
                    onChange={onSearchTermChange}
                    disabled={isLoading}
                    className="w-full"
                    aria-label="Поиск по параметрам зоны"
                />
            </div>

            {/* Supplier Name Search - Conditionally render */}
            {showSupplierSearch && (
                <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                        Поиск по названию поставщика
                    </label>
                    <Input
                        type="text"
                        placeholder="Название поставщика..."
                        value={supplierName || ''}
                        onChange={onSupplierNameChange}
                        disabled={isLoading}
                        className="w-full"
                        aria-label="Поиск по названию поставщика"
                    />
                </div>
            )}
        </div>
    );
};
