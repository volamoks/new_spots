import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils/api';
import { ZoneStatus } from '@prisma/client'; // Import ZoneStatus for filtering available zones

// Define the structure for supplier options
interface SupplierOption {
    inn: string;
    name: string;
}

// Define the structure for the response
interface FilterOptionsResponse {
    cities: string[];
    markets: string[];
    macrozones: string[];
    equipments: string[];
    suppliers: SupplierOption[];
}

export async function GET(req: Request) { // Add req back to read query params
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const context = searchParams.get('context') || 'manage'; // Default to 'manage'

        let distinctCities, distinctMarkets, distinctMacrozones, distinctEquipments, suppliersInfo;

        if (context === 'create') {
            // --- Fetch options for CREATING bookings ---
            // Fetch attributes from AVAILABLE zones
            const availableZoneWhere = {
                status: ZoneStatus.AVAILABLE, // Only consider available zones
                // Add other relevant filters if needed, e.g., based on user category
            };

            distinctCities = await prisma.zone.findMany({
                where: { ...availableZoneWhere, city: { not: '' } },
                distinct: ['city'], select: { city: true }, orderBy: { city: 'asc' },
            });
            distinctMarkets = await prisma.zone.findMany({
                where: { ...availableZoneWhere, market: { not: '' } },
                distinct: ['market'], select: { market: true }, orderBy: { market: 'asc' },
            });
            distinctMacrozones = await prisma.zone.findMany({
                where: { ...availableZoneWhere, mainMacrozone: { not: '' } },
                distinct: ['mainMacrozone'], select: { mainMacrozone: true }, orderBy: { mainMacrozone: 'asc' },
            });
            distinctEquipments = await prisma.zone.findMany({
                where: { ...availableZoneWhere, equipment: { not: '' } },
                distinct: ['equipment'], select: { equipment: true }, orderBy: { equipment: 'asc' },
            });
            // Fetch ALL suppliers
            suppliersInfo = await prisma.innOrganization.findMany({
                select: { inn: true, name: true }, orderBy: { name: 'asc' },
            });

        } else { // context === 'manage' or default
            // --- Fetch options for MANAGING bookings (existing logic) ---
            const bookedZoneWhere = { bookings: { some: {} } };

            distinctCities = await prisma.zone.findMany({
                where: { ...bookedZoneWhere, city: { not: '' } },
                distinct: ['city'], select: { city: true }, orderBy: { city: 'asc' },
            });
            distinctMarkets = await prisma.zone.findMany({
                where: { ...bookedZoneWhere, market: { not: '' } },
                distinct: ['market'], select: { market: true }, orderBy: { market: 'asc' },
            });
            distinctMacrozones = await prisma.zone.findMany({
                where: { ...bookedZoneWhere, mainMacrozone: { not: '' } },
                distinct: ['mainMacrozone'], select: { mainMacrozone: true }, orderBy: { mainMacrozone: 'asc' },
            });
            distinctEquipments = await prisma.zone.findMany({
                where: { ...bookedZoneWhere, equipment: { not: '' } },
                distinct: ['equipment'], select: { equipment: true }, orderBy: { equipment: 'asc' },
            });

            const distinctSupplierNames = await prisma.zone.findMany({
                where: { ...bookedZoneWhere, AND: [ { supplier: { not: null } }, { supplier: { not: '' } } ] },
                distinct: ['supplier'], select: { supplier: true }, orderBy: { supplier: 'asc' },
            });
            const supplierNames = distinctSupplierNames.map(z => z.supplier).filter((s): s is string => s !== null);
            suppliersInfo = await prisma.innOrganization.findMany({
                where: { name: { in: supplierNames } },
                select: { inn: true, name: true }, orderBy: { name: 'asc' },
            });
        }

        // Format the response (common logic)
        const response: FilterOptionsResponse = {
            cities: distinctCities.map(z => z.city).filter((c): c is string => c !== null),
            markets: distinctMarkets.map(z => z.market).filter((m): m is string => m !== null),
            macrozones: distinctMacrozones.map(z => z.mainMacrozone).filter((m): m is string => m !== null),
            equipments: distinctEquipments.map(z => z.equipment).filter((e): e is string => e !== null),
            suppliers: suppliersInfo,
        };

        return NextResponse.json(response);

    } catch (error) {
        return handleApiError(error);
    }
}