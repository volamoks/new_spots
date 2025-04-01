// File: app/api/suppliers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch distinct organizations (suppliers) based on INN from the InnOrganization table
        const organizations = await prisma.innOrganization.findMany({
            select: {
                inn: true,  // Select the INN field
                name: true, // Select the name field
            },
            where: {
                // Optional: Add a filter to exclude entries with missing/empty inn or name if necessary
                inn: { not: null, not: '' }, // Ensure INN is present
                name: { not: null, not: '' }  // Ensure name is present
            },
            orderBy: {
                name: 'asc', // Sort by name
            },
            distinct: ['inn'] // Return only unique suppliers based on INN
        });

        // Return the array of objects directly
        return NextResponse.json(organizations, { status: 200 });

    } catch (error) {
        console.error('Error fetching suppliers:', error); // Updated error message context
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}
