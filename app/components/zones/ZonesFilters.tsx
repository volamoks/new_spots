'use client';

import React from 'react'; // Removed useCallback
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoneFilterTabs } from './ZoneFilterTabs';
import { RefreshCw } from 'lucide-react';
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Use role data hook
import { InteractiveZoneFilters } from './InteractiveZoneFilters'; // IMPORT NEW COMPONENT
import { SearchFilters } from '@/app/components/booking/SearchFilters'; // Keep SearchFilters

// Keep selectedCategory prop if it's passed from parent and needed by InteractiveZoneFilters
export function ZonesFilters({ selectedCategory = null }) {
    // Use useRoleData hook for consistency with page and table
    const {
        isLoading,
        setFilterCriteria,
        resetFilters,
        fetchZones,
        filterCriteria: { activeTab, searchTerm },
    } = useRoleData('dmp');

    // --- Handlers for components remaining in ZonesFilters ---
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ searchTerm: e.target.value });
    };

    const handleTabChange = (tab: string) => {
        setFilterCriteria({ activeTab: tab });
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
                <h3 className="text-xl font-semibold my-4">Выбор фильтров зон</h3>
                {/* Tabs */}
                <ZoneFilterTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange} // Use simplified handler
                    isDisabled={isLoading}
                    className="mb-4"
                />

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <SearchFilters
                            searchTerm={searchTerm}
                            supplierName="" // Not used here
                            isLoading={isLoading}
                            onSearchTermChange={handleSearchTermChange}
                            onSupplierNameChange={() => {}} // Dummy handler
                        />
                    </div>
                </div>

                {/* Combined Dropdowns and Selected Filters */}
                <InteractiveZoneFilters selectedCategory={selectedCategory} />
            </CardContent>
            <div className="flex gap-2 m-6 justify-end">
                <Button
                    variant="outline"
                    onClick={resetFilters}
                    disabled={isLoading}
                    className="whitespace-nowrap"
                >
                    Сбросить фильтры
                </Button>
                <Button
                    onClick={fetchZones}
                    disabled={isLoading}
                    className="whitespace-nowrap"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить
                </Button>
            </div>
        </Card>
    );
}
