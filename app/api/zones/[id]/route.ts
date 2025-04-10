// File: app/api/zones/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, ZoneStatus, Role } from '@prisma/client'; // Добавлены Role и ZoneStatus
import getRedisClient from '@/lib/redis';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Обработчик DELETE запроса для удаления зоны по ID
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const zoneId = params.id;

    // --- Authentication & Authorization Check ---
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== Role.DMP_MANAGER) {
        return NextResponse.json(
            { error: "Forbidden: Only DMP Managers can delete zones." },
            { status: 403 }
        )
    }
    // --- End Check ---

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

        // --- Cache Invalidation ---
        try {
            const redisClient = getRedisClient(); // Get client instance
            const keys = await redisClient.keys('zones:*'); // Find all zone cache keys
            if (keys.length > 0) {
                await redisClient.del(keys); // Delete them
                console.log(`Invalidated ${keys.length} zone cache keys after deleting zone ${zoneId}.`);
            }
        } catch (redisError) {
            console.error(`Redis cache invalidation error after deleting zone ${zoneId}:`, redisError);
            // Log error but don't fail the request
        }
        // --- End Cache Invalidation ---

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

    // --- Authentication & Authorization Check ---
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== Role.DMP_MANAGER) {
        return NextResponse.json(
            { error: "Forbidden: Only DMP Managers can update zones." },
            { status: 403 }
        )
    }
    // --- End Check ---

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Accept status, supplier, brand from the body
        const { status, supplier, brand }: { status?: ZoneStatus, supplier?: string | null, brand?: string | null } = body;

        // Определяем, какие данные обновлять
        const dataToUpdate: Prisma.ZoneUpdateInput = {};
        const updatedFields: string[] = [];

        if (status !== undefined) {
            dataToUpdate.status = status;
            updatedFields.push('status');
            // If status is set to AVAILABLE, clear supplier and brand
            if (status === ZoneStatus.AVAILABLE) {
                dataToUpdate.supplier = null;
                dataToUpdate.brand = null;
                updatedFields.push('supplier', 'brand');
            }
        } else if (supplier !== undefined) {
            // Keep original logic for direct supplier/brand update if status is not provided
            dataToUpdate.supplier = supplier === '' ? null : supplier;
            dataToUpdate.status = ZoneStatus.UNAVAILABLE; // Устанавливаем статус UNAVAILABLE
            updatedFields.push('supplier', 'status');
        } else if (brand !== undefined) {
            dataToUpdate.brand = brand === '' ? null : brand;
            dataToUpdate.status = ZoneStatus.UNAVAILABLE; // Устанавливаем статус UNAVAILABLE
            updatedFields.push('brand', 'status');
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: 'No valid fields (status, supplier, or brand) provided for update' }, { status: 400 });
        }

        // Обновляем зону
        const updatedZone = await prisma.zone.update({
            where: { id: zoneId },
            data: dataToUpdate,
        });

        console.log(`Updated fields [${updatedFields.join(', ')}] for zone ${zoneId}`);

        // --- Cache Invalidation ---
        try {
            const redisClient = getRedisClient(); // Get client instance
            const keys = await redisClient.keys('zones:*'); // Find all zone cache keys
            if (keys.length > 0) {
                await redisClient.del(keys); // Delete them
                console.log(`Invalidated ${keys.length} zone cache keys after updating zone ${zoneId}.`);
            }
        } catch (redisError) {
            console.error(`Redis cache invalidation error after updating zone ${zoneId}:`, redisError);
            // Log error but don't fail the request
        }
        // --- End Cache Invalidation ---

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
