'use client';

import React, { useEffect } from 'react';
import { Zone } from '@/types/zone';
import { useZonesManagementStore } from '@/lib/stores/zonesManagementStore';
import { ZoneFilters } from './zones/ZoneFilters';
import { ZoneTableDisplay } from './zones/ZoneTableDisplay';

interface ZonesManagementTableProps {
    zones: Zone[];
    onRefresh: () => void;
}

export function ZonesManagementTable({ zones, onRefresh }: ZonesManagementTableProps) {
    const setZonesAndRefresh = useZonesManagementStore(state => state.setZonesAndRefresh);

    useEffect(() => {
        setZonesAndRefresh(zones, onRefresh);
    }, [zones, onRefresh, setZonesAndRefresh]);

    return (
        <div className="space-y-4">
            <ZoneFilters />
            <ZoneTableDisplay />
        </div>
    );
}
