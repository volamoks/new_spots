// File: app/api/zones/bulk-delete/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    try {
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