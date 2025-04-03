import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Assuming authOptions are defined here
import { prisma } from '@/lib/prisma'; // Assuming prisma client is here (named export)
import { Role, Prisma } from '@prisma/client'; // Import Role enum and Prisma namespace
import { type NextRequest } from 'next/server'; // Import NextRequest

export async function GET(request: NextRequest) { // Add request parameter
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get search query parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const user = session.user;
    // Start with base where clause (will be combined with AND)
    const baseWhereClauses: Prisma.BrandWhereInput[] = [];

    // Supplier specific filtering
    if (user.role === Role.SUPPLIER && user.inn) {
      // Filter brands associated with the current supplier user
      baseWhereClauses.push({
        suppliers: {
          some: {
            id: user.id,
          },
        },
      });
    }
    // Add other role-based filters here if needed in the future

    // Add search term filtering
    if (search) {
      baseWhereClauses.push({
        name: {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
        },
      });
    }

    // Combine all where clauses with AND
    const whereClause = baseWhereClauses.length > 0 ? { AND: baseWhereClauses } : {};

    const brands = await prisma.brand.findMany({
      where: whereClause,
      take: 20, // Limit results
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(brands, { status: 200 });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}