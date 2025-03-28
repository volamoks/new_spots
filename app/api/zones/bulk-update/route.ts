// File: app/api/zones/bulk-update/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ZoneStatus } from '@prisma/client'; // Используем ZoneStatus из Prisma

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

        // Обновляем статус зон
        const result = await prisma.zone.updateMany({
            where: {
                id: {
                    in: zoneIds,
                },
            },
            data: {
                status: status as ZoneStatus,
            },
        });

        console.log(`Bulk updated status for ${result.count} zones to ${status}`);

        // Возвращаем количество обновленных записей
        return NextResponse.json({ count: result.count }, { status: 200 });

    } catch (error) {
        console.error('Error during bulk zone status update:', error);
        return NextResponse.json({ error: 'Failed to bulk update zone statuses' }, { status: 500 });
    }
}