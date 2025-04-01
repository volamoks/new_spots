import { prisma } from "./prisma";
import { Zone as AppZone, ZoneStatus as AppZoneStatus } from "@/types/zone";
import { Prisma, Zone as PrismaZone, ZoneStatus as PrismaZoneStatus } from "@prisma/client";

// Helper function to map Prisma Status to App Status
const mapPrismaStatusToAppStatus = (status: PrismaZoneStatus): AppZoneStatus => {
  switch (status) {
    case PrismaZoneStatus.AVAILABLE:
      return AppZoneStatus.AVAILABLE;
    case PrismaZoneStatus.BOOKED:
      return AppZoneStatus.BOOKED;
    case PrismaZoneStatus.UNAVAILABLE:
    default:
      return AppZoneStatus.UNAVAILABLE;
  }
};

// Helper function to map Prisma Zone to App Zone
const mapPrismaZoneToAppZone = (zone: PrismaZone): AppZone => {
  return {
    ...zone,
    status: mapPrismaStatusToAppStatus(zone.status),
    // Ensure other potentially incompatible fields are mapped if necessary
    // For now, assuming only status needs mapping based on the error
  };
};


interface FetchZonesParams {
  city?: string[]; // Changed to array
  market?: string[]; // Changed to array
  macrozone?: string[]; // Changed to array (removed single string option)
  equipment?: string[]; // Added array type
  supplier?: string[]; // Added array type
  category?: string; // Keep as single string? Or array? API uses single.
  status?: AppZoneStatus;
  page?: number;
  pageSize?: number;
  // Add sorting params if needed
  // sortField?: ZoneKeys;
  // sortDirection?: 'asc' | 'desc';
}

interface FetchZonesResult {
  zones: AppZone[]; // Use renamed type
  totalCount: number;
}

/**
 * Fetches zones with filtering and pagination.
 */
export const fetchZones = async ({
  city,
  market,
  macrozone,
  equipment, // Added
  supplier, // Added
  // category, // Removed as it's handled via macrozone mapping in API route
  status,
  page = 1, // Default to page 1
  pageSize = 20, // Default page size
}: FetchZonesParams): Promise<FetchZonesResult> => {
  try {
    // Use specific Prisma type for whereClause
    const whereClause: Prisma.ZoneWhereInput = {};

    // Handle array filters using 'in' operator
    if (city && city.length > 0) {
      whereClause.city = { in: city, mode: 'insensitive' };
    }
    if (market && market.length > 0) {
      whereClause.market = { in: market, mode: 'insensitive' };
    }
    if (macrozone && macrozone.length > 0) {
      // Assuming macrozone filter should match either main or adjacent
      whereClause.OR = [
        { mainMacrozone: { in: macrozone, mode: 'insensitive' } },
        { adjacentMacrozone: { in: macrozone, mode: 'insensitive' } }
      ];
      // If only mainMacrozone: whereClause.mainMacrozone = { in: macrozone, mode: 'insensitive' };
    }
    if (equipment && equipment.length > 0) {
      whereClause.equipment = { in: equipment, mode: 'insensitive' };
    }
    if (supplier && supplier.length > 0) {
      whereClause.supplier = { in: supplier, mode: 'insensitive' };
    }

    // Handle single value filters
    // REMOVED: Category filter is handled by converting to macrozones in the API route
    // if (category) {
    //   whereClause.category = category;
    // }
    if (status) {
      whereClause.status = status;
    }

    console.log("fetchZones: whereClause =", JSON.stringify(whereClause));

    const queryOptions = {
      orderBy: [
        { city: Prisma.SortOrder.asc }, // Use Prisma.SortOrder
        { market: Prisma.SortOrder.asc } // Use Prisma.SortOrder
      ],
    };

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;

    // Perform two queries: one for the count, one for the data
    const [totalCount, zones] = await prisma.$transaction([
      prisma.zone.count({
        where: whereClause,
      }),
      prisma.zone.findMany({
        where: whereClause,
        ...queryOptions,
        take: pageSize,
        skip: skip,
      })
    ]);

    console.log(`fetchZones: Found ${zones.length} zones on page ${page} (Total: ${totalCount})`);

    // Map Prisma zones to App zones before returning
    const mappedZones = zones.map(mapPrismaZoneToAppZone);

    return { zones: mappedZones, totalCount };
  } catch (error) {
    console.error("Error fetching zones:", error);
    // Return empty result on error
    return { zones: [], totalCount: 0 };
  }
};

/**
 * Обновляет статус указанной зоны
 * @param id Идентификатор зоны
 * @param status Новый статус зоны
 * @returns Обновленная зона или null в случае ошибки
 */
export const updateZoneStatus = async (id: string, status: AppZoneStatus) => { // Use renamed type
  try {
    const updatedZone = await prisma.zone.update({
      where: { id },
      data: { status },
    });
    return updatedZone;
  } catch (error) {
    console.error("Error updating zone status:", error);
    throw error;
  }
};
