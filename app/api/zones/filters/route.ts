import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZoneStatus, Prisma, Zone as PrismaZone } from "@prisma/client";

// Helper function to fetch and sort distinct non-empty values for a field
async function getDistinctValues<K extends keyof PrismaZone>(field: K) { // Let TS infer return type
    try {
        // Fetch distinct values without the problematic where clause
        const results = await prisma.zone.findMany({
            select: {
                [field]: true,
            },
            distinct: [field as Prisma.ZoneScalarFieldEnum],
            // orderBy clause removed for simplification
        }); // Removed cast

        // Log raw results for debugging specific fields
        if (field === 'mainMacrozone' || field === 'equipment') {
            console.log(`Raw results for ${String(field)}:`, results);
        }

        // Extract the value and filter out nulls/undefined/empty strings robustly
        // Use a less specific type like Record<string, unknown> to satisfy linter
        const values = results.map((item: Record<string, unknown>) => item[field]);
        const filteredValues = values.filter(value => value !== null && value !== undefined && String(value).trim() !== '');

        // Sort the filtered values using JavaScript's sort
        // Ensure consistent sorting for strings
        filteredValues.sort((a, b) => String(a).localeCompare(String(b)));

        // Log filtered results for debugging
        if (field === 'mainMacrozone' || field === 'equipment') {
            console.log(`Sorted & Filtered values for ${String(field)}:`, filteredValues); // Updated log message
        }
        return filteredValues; // Return the filtered and sorted array

    } catch (error) {
        console.error(`Error fetching distinct values for field ${String(field)}:`, error);
        throw error; // Re-throw
    }
}

export async function GET() {
    try {
        console.log("Fetching distinct filter options...");

        // Fetch all distinct values in parallel using Promise.all
        // Explicitly type the results from Promise.all if needed, or let TS infer
        const [cities, markets, macrozones, equipments, suppliers] = await Promise.all([
            getDistinctValues('city'),
            getDistinctValues('market'),
            getDistinctValues('mainMacrozone'),
            getDistinctValues('equipment'),
            getDistinctValues('supplier'),
        ]);

        // Manually add all ZoneStatus enum values
        const statuses = Object.values(ZoneStatus);

        const responseData = {
            cities,
            markets,
            macrozones,
            equipments,
            suppliers,
            statuses,
        };

        console.log("Successfully fetched filter options:", responseData);

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching zone filter options in GET handler:", error);
        return NextResponse.json(
            { error: "Failed to fetch filter options" },
            { status: 500 }
        );
    }
}