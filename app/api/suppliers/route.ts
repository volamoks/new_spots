// File: app/api/suppliers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Получаем все организации (поставщиков) из таблицы InnOrganization
        const organizations = await prisma.innOrganization.findMany({
            select: {
                name: true, // Выбираем только поле name
            },
            orderBy: {
                name: 'asc', // Сортируем по имени
            }
        });

        // Извлекаем только имена
        const supplierNames = organizations.map(org => org.name);

        return NextResponse.json(supplierNames, { status: 200 });

    } catch (error) {
        console.error('Error fetching unique suppliers:', error);
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}
