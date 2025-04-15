import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Assuming authOptions are defined here
import { prisma } from '@/lib/prisma'; // Assuming prisma client is here (named export)
import { Prisma } from '@prisma/client'; // Import Prisma namespace
import { type NextRequest } from 'next/server'; // Import NextRequest
import getRedisClient from '@/lib/redis'; // Import Redis client factory function
// Removed duplicate import of NextResponse

const DEFAULT_LIMIT = 100; // Define a default limit
const CACHE_TTL = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient(); // Get the Redis client instance
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get search and limit query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

    // --- Redis Caching Logic ---
    const searchTerm = search || 'initial'; // Use 'initial' if no search term
    const cacheKey = `brands:${searchTerm}:${limit}`;

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

    // --- Prisma Query Logic ---
    let whereClause: Prisma.BrandWhereInput = {};
    if (search) {
      whereClause = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const brands = await prisma.brand.findMany({
      where: whereClause,
      take: limit, // Apply limit
      orderBy: {
        name: 'asc',
      },
      // Select only necessary fields if possible
      // select: { id: true, name: true }
    });
    // --- End Prisma Query Logic ---


    // --- Store in Redis ---
    try {
      // Cache even empty results to avoid hitting DB repeatedly for non-existent searches
      await redis.set(cacheKey, JSON.stringify(brands), 'EX', CACHE_TTL);
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