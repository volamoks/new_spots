'use client';

import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';

export default function SupplierZonesPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <ZonesSummaryCard />
                <ZonesFilters />

                <ZonesTable />
            </main>
        </div>
    );
}
