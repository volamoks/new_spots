import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Assuming authOptions are defined here
import { prisma } from '@/lib/prisma'; // Assuming prisma client is here (named export)
import { Role, Prisma } from '@prisma/client'; // Import Role enum and Prisma namespace
import { type NextRequest } from 'next/server'; // Import NextRequest
import redis from '@/lib/redis'; // Import Redis client
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
    // Supplier specific filtering - ADDED CHECKS for role and inn
    if (user.role === Role.SUPPLIER) {
      if (!user.id || !user.inn) {
        // If essential supplier info is missing in session, return an error
        console.error(`Supplier user (ID: ${user.id || 'unknown'}) missing INN in session data.`);
        return NextResponse.json({ message: 'Forbidden: Incomplete supplier information in session' }, { status: 403 });
      }
      // Filter brands associated with the current supplier user
      baseWhereClauses.push({
        suppliers: {
          some: {
            id: user.id, // user.id is guaranteed by the check above and the initial session check
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

    // --- Redis Caching Logic ---
    const cacheKey = `brands:${user.role}:${user.role === Role.SUPPLIER ? user.id : 'all'}:${search || 'all'}`;
    const cacheTTL = 86400; // Cache for 24 hours

    try {
      const cachedBrands = await redis.get(cacheKey);
      if (cachedBrands) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return NextResponse.json(JSON.parse(cachedBrands), { status: 200 });
      }
      console.log(`Cache miss for key: ${cacheKey}`);
    } catch (redisError) {
      console.error(`Redis GET error for key ${cacheKey}:`, redisError);
      // Proceed to fetch from DB if Redis fails
    }
    // --- End Redis Caching Logic ---


    const brands = await prisma.brand.findMany({
      where: whereClause,
      take: 20, // Limit results
      orderBy: {
        name: 'asc',
      },
    });

    // --- Store in Redis ---
    try {
      await redis.set(cacheKey, JSON.stringify(brands), 'EX', cacheTTL);
      console.log(`Cached data for key: ${cacheKey}`);
    } catch (redisError) {
      console.error(`Redis SET error for key ${cacheKey}:`, redisError);
      // Don't fail the request if caching fails
    }
    // --- End Store in Redis ---

    return NextResponse.json(brands, { status: 200 });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}