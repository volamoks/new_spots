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
                    Search by Zone Parameters {/* TODO: i18n */}
                </label>
                <Input
                    type="text"
                    placeholder="City, market, macrozone, equipment..." /* TODO: i18n */
                    value={searchTerm || ''}
                    onChange={onSearchTermChange}
                    disabled={isLoading}
                    className="w-full"
                    aria-label="Search by zone parameters" // Added aria-label
                />
            </div>

            {/* Supplier Name Search - Conditionally render */}
            {showSupplierSearch && (
                <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                        Search by Supplier Name {/* TODO: i18n */}
                    </label>
                    <Input
                        type="text"
                        placeholder="Supplier name..." /* TODO: i18n */
                        value={supplierName || ''}
                        onChange={onSupplierNameChange}
                        disabled={isLoading}
                        className="w-full"
                        aria-label="Search by supplier name" // Added aria-label
                    />
                </div>
            )}
        </div>
    );
};
