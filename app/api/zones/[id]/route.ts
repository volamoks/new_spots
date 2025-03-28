// File: app/api/zones/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Исправлено: используем именованный импорт
import { Prisma } from '@prisma/client';

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

// Можно добавить обработчики для других методов (GET, PATCH), если они нужны в этом файле
// export async function GET(...) {}
// export async function PATCH(...) {}
