import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getRedisClient from '@/lib/redis'; // Use the lazy-loading function
import { Role } from '@prisma/client';

export async function POST() { // Changed to POST as it's an action
  try {
    // 1. Authorization Check
    const session = await getServerSession(authOptions);
    // Allow only DMP Managers to clear the cache
    if (!session || session.user.role !== Role.DMP_MANAGER) {
      console.log("API clear-zones-cache: Unauthorized attempt.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`API clear-zones-cache: User ${session.user.id} attempting to clear zone cache.`);

    // 2. Get Redis Client
    const redis = getRedisClient();

    // 3. Find and Delete Keys
    const keys = await redis.keys('zones:*'); // Find all keys starting with 'zones:'

    let deletedCount = 0;
    if (keys.length > 0) {
      console.log(`API clear-zones-cache: Found ${keys.length} zone cache keys to delete.`);
      deletedCount = await redis.del(keys);
      console.log(`API clear-zones-cache: Successfully deleted ${deletedCount} zone cache keys.`);
    } else {
      console.log('API clear-zones-cache: No zone cache keys found to delete.');
    }

    // 4. Return Success Response
    return NextResponse.json({ message: `Successfully cleared ${deletedCount} zone cache entries.` }, { status: 200 });

  } catch (error) {
    console.error("API clear-zones-cache: Error clearing Redis zone cache:", error);
    // Distinguish between known errors and server errors
    if (error instanceof Error && error.message.includes('Redis Client Error')) {
         return NextResponse.json({ error: 'Failed to connect to Redis' }, { status: 503 }); // Service Unavailable
    }
    return NextResponse.json({ error: 'Failed to clear zone cache' }, { status: 500 });
  }
}