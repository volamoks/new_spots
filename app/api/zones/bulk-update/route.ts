// File: app/api/zones/bulk-update/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ZoneStatus } from '@prisma/client'; // Используем ZoneStatus из Prisma
import redis from '@/lib/redis'; // Import Redis client

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zoneIds, status } = body;

        // Валидация входных данных
        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return NextResponse.json({ error: 'zoneIds must be a non-empty array' }, { status: 400 });
        }
        if (!status || !Object.values(ZoneStatus).includes(status as ZoneStatus)) {
            return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
        }

        // Prepare data for update
        const updateData: { status: ZoneStatus; supplier?: null; brand?: null } = {
            status: status as ZoneStatus,
        };

        // If status is AVAILABLE, also clear supplier and brand
        if (status === ZoneStatus.AVAILABLE) {
            updateData.supplier = null;
            updateData.brand = null;
        }

        // Обновляем зоны
        const result = await prisma.zone.updateMany({
            where: {
                id: {
                    in: zoneIds,
                },
            },
            data: updateData, // Use the prepared data object
        });

        console.log(`Bulk updated status for ${result.count} zones to ${status}`);

        // --- Cache Invalidation ---
        try {
            const keys = await redis.keys('zones:*'); // Find all zone cache keys
            if (keys.length > 0) {
                await redis.del(keys); // Delete them
                console.log(`Invalidated ${keys.length} zone cache keys after bulk update.`);
            }
        } catch (redisError) {
            console.error("Redis cache invalidation error during bulk update:", redisError);
            // Log error but don't fail the request
        }
        // --- End Cache Invalidation ---

        // Возвращаем количество обновленных записей
        return NextResponse.json({ count: result.count }, { status: 200 });

    } catch (error) {
        console.error('Error during bulk zone status update:', error);
        return NextResponse.json({ error: 'Failed to bulk update zone statuses' }, { status: 500 });
    }
}