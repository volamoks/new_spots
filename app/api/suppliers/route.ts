// File: app/api/suppliers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch distinct organizations (suppliers) based on INN from the InnOrganization table
        // Reverted to original logic based on user feedback
        const organizations = await prisma.innOrganization.findMany({
            select: {
                inn: true,  // Select the INN field
                name: true, // Select the name field
            },
            where: {
                // Filter for non-empty inn and name
                AND: [
                    { inn: { not: '' } },
                    { name: { not: '' } },
                ]
            },
            orderBy: {
                name: 'asc', // Sort by name
            },
            distinct: ['inn'] // Return only unique suppliers based on INN
        });

        // Map to expected format { inn, name }
        const formattedSuppliers = organizations.map(org => ({
            inn: org.inn!, // Use non-null assertion as we filtered
            name: org.name!, // Use non-null assertion as we filtered
            // id is not available/needed from InnOrganization for the dropdown
        }));

        // Return the array of objects directly
        return NextResponse.json(formattedSuppliers, { status: 200 });

    } catch (error) {
        console.error('Error fetching organizations:', error); // Updated error message context
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}
