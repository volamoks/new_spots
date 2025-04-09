import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import getRedisClient from '@/lib/redis'; // Import the function

export async function DELETE(request: Request) {
  try {
    // 1. Authorization Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'DMP_MANAGER') { // Ensure only DMP Managers can delete
      console.log("API bulk-delete: Unauthorized attempt.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request Body
    const { zoneIds } = await request.json();

    if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
      console.log("API bulk-delete: Invalid or empty zoneIds received.");
      return NextResponse.json({ error: 'Invalid input: zoneIds must be a non-empty array.' }, { status: 400 });
    }

    console.log(`API bulk-delete: User ${session.user.id} attempting to delete ${zoneIds.length} zones.`);

    // 3. Database Operation
    const deleteResult = await prisma.zone.deleteMany({
      where: {
        id: {
          in: zoneIds,
        },
      },
    });

    console.log(`API bulk-delete: Successfully deleted ${deleteResult.count} zones.`);

    // 4. Cache Invalidation (Important!)
    // Since deleting zones affects potentially many cached GET requests,
    // a simple approach is to invalidate all zone-related keys.
    // A more complex approach could try to identify specific keys, but might be error-prone.
    try {
      const redis = getRedisClient(); // Get the client instance
      const keys = await redis.keys('zones:*'); // Find all keys starting with 'zones:'
      if (keys.length > 0) {
        await redis.del(keys); // Use the instance
        console.log(`API bulk-delete: Invalidated ${keys.length} zone cache keys.`);
      }
    } catch (redisError) {
      console.error("API bulk-delete: Redis cache invalidation failed:", redisError);
      // Log the error but don't fail the request, deletion was successful.
    }

    // 5. Return Success Response
    return NextResponse.json({ message: `Successfully deleted ${deleteResult.count} zones.` }, { status: 200 });

  } catch (error) {
    console.error("API bulk-delete: Error deleting zones:", error);
    // Distinguish between known errors (like invalid input) and server errors
    if (error instanceof SyntaxError) { // JSON parsing error
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete zones' }, { status: 500 });
  }
}