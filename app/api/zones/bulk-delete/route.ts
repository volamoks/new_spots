// File: app/api/zones/bulk-delete/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client'; // Added Role
import redis from '@/lib/redis';
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
                { error: "Forbidden: Only DMP Managers can bulk delete zones." },
                { status: 403 }
            )
        }
        // --- End Check ---

        const body = await request.json();
        const { zoneIds } = body;

        // Валидация входных данных
        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return NextResponse.json({ error: 'zoneIds must be a non-empty array' }, { status: 400 });
        }

        // Удаляем зоны
        const result = await prisma.zone.deleteMany({
            where: {
                id: {
                    in: zoneIds,
                },
            },
        });

        console.log(`Bulk deleted ${result.count} zones`);

        // --- Cache Invalidation ---
        if (result.count > 0) { // Only invalidate if something was actually deleted
            try {
                const keys = await redis.keys('zones:*'); // Find all zone cache keys
                if (keys.length > 0) {
                    await redis.del(keys); // Delete them
                    console.log(`Invalidated ${keys.length} zone cache keys after bulk delete.`);
                }
            } catch (redisError) {
                console.error("Redis cache invalidation error during bulk delete:", redisError);
                // Log error but don't fail the request
            }
        }
        // --- End Cache Invalidation ---

        // Возвращаем количество удаленных записей
        return NextResponse.json({ count: result.count }, { status: 200 });

    } catch (error) {
        console.error('Error during bulk zone delete:', error);

        // Обработка ошибки внешнего ключа (P2003)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json(
                {
                    error: 'Cannot delete some zones because they are associated with existing bookings.',
                    code: 'P2003',
                },
                { status: 409 }, // 409 Conflict
            );
        }

        // Общая ошибка сервера
        return NextResponse.json({ error: 'Failed to bulk delete zones' }, { status: 500 });
    }
}