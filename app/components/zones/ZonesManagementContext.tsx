'use client';

import { createContext, useContext } from 'react'; // Removed unused React, ReactNode
import { Zone } from '@/types/zone';
import { ZoneFilterValues } from './ZoneFilters'; // Keep this path relative

// Define the shape of the context data
export interface IZonesManagementContext {
    originalZones: Zone[];
    filteredZones: Zone[];
    handleFilterChange: (newFilters: ZoneFilterValues) => void;
    onRefresh: () => void;
    isLoading: boolean;
    originalZoneCount: number;
}

// Create the context with a default value (or null/undefined and check in consumers)
// Export the context directly for use in the table component's provider tag
export const ZonesManagementContext = createContext<IZonesManagementContext | null>(null);

// Custom hook to use the context easily and ensure it's used within a provider
export const useZonesManagement = (): IZonesManagementContext => {
    const context = useContext(ZonesManagementContext);
    if (!context) {
        throw new Error('useZonesManagement must be used within a ZonesManagementContext.Provider');
    }
    return context;
};

// Removed the ZonesManagementProvider component
