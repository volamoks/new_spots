// File: app/api/zones/bulk-update/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ZoneStatus, Role } from '@prisma/client'; // Added Role
import getRedisClient from '@/lib/redis';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
    try {
        // --- Authentication & Authorization Check ---
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (session.user.role !== Role.DMP_MANAGER) {
            return NextResponse.json(
                { error: "Forbidden: Only DMP Managers can bulk update zone statuses." },
                { status: 403 }
            )
        }
        // --- End Check ---

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
            const redisClient = getRedisClient(); // Get client instance
            const keys = await redisClient.keys('zones:*'); // Find all zone cache keys
            if (keys.length > 0) {
                await redisClient.del(keys); // Delete them
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