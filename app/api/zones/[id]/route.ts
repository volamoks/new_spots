// File: app/api/zones/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Исправлено: используем именованный импорт
import { Prisma, ZoneStatus } from '@prisma/client'; // Добавлен ZoneStatus

// Обработчик DELETE запроса для удаления зоны по ID
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const zoneId = params.id;

    if (!zoneId) {
        return NextResponse.json(
            { error: 'Zone ID is required' },
            { status: 400 },
        );
    }

    try {
        // Пытаемся удалить зону
        await prisma.zone.delete({
            where: {
                id: zoneId,
            },
        });

        // Возвращаем успешный ответ без содержимого
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`Error deleting zone ${zoneId}:`, error);

        // Обработка специфических ошибок Prisma
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Ошибка: Запись для удаления не найдена
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { error: `Zone with ID ${zoneId} not found` },
                    { status: 404 },
                );
            }
            // Ошибка: Нарушение ограничения внешнего ключа (зона связана с другими записями, например, Bookings)
            if (error.code === 'P2003') {
                // Возвращаем статус 409 Conflict, чтобы фронтенд мог это обработать
                return NextResponse.json(
                    {
                        error: `Cannot delete zone ${zoneId} because it is associated with existing bookings. Please delete the bookings first.`,
                        code: 'P2003', // Передаем код ошибки для фронтенда
                    },
                    { status: 409 }, // 409 Conflict
                );
            }
        }

        // Общая ошибка сервера
        return NextResponse.json(
            { error: 'Failed to delete zone' },
            { status: 500 },
        );
    } finally {
        // Отключение от Prisma не требуется в контексте Next.js API routes,
        // так как Prisma Client управляет соединениями.
        // await prisma.$disconnect();
    }
}

// Обработчик PATCH запроса для обновления полей зоны (supplier, brand)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } },
) {
    const zoneId = params.id;

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { supplier, brand } = body;

        // Определяем, какие данные обновлять
        // Добавляем status в тип
        const dataToUpdate: { supplier?: string | null; brand?: string | null; status?: ZoneStatus } = {};
        let updatedField = '';

        if (supplier !== undefined) {
            // Разрешаем установку null или пустой строки (которая станет null в БД, если поле nullable)
            dataToUpdate.supplier = supplier === '' ? null : supplier;
            dataToUpdate.status = ZoneStatus.UNAVAILABLE; // Устанавливаем статус UNAVAILABLE
            updatedField = 'supplier';
        } else if (brand !== undefined) {
            // Разрешаем установку null или пустой строки
            dataToUpdate.brand = brand === '' ? null : brand;
            dataToUpdate.status = ZoneStatus.UNAVAILABLE; // Устанавливаем статус UNAVAILABLE
            updatedField = 'brand';
        } else {
            return NextResponse.json({ error: 'No valid field (supplier or brand) provided for update' }, { status: 400 });
        }

        // Обновляем зону
        const updatedZone = await prisma.zone.update({
            where: { id: zoneId },
            data: dataToUpdate,
        });

        console.log(`Updated ${updatedField} for zone ${zoneId}`);

        return NextResponse.json(updatedZone, { status: 200 });

    } catch (error) {
        console.error(`Error updating zone ${zoneId}:`, error);

        // Обработка ошибки, если зона не найдена
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ error: `Zone with ID ${zoneId} not found` }, { status: 404 });
        }

        // Общая ошибка сервера
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
    }
}

// Можно добавить обработчик GET, если нужно получать данные одной зоны
// export async function GET(...) {}
