import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем поставщиков для бронирования
    const suppliers = await prisma.innOrganization.findMany({
      select: {
        id: true,
        name: true,
        inn: true,
      },
      where: {
        // Добавляем фильтры для бронирования, если необходимо
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    return handleApiError(error);
  }
}
