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

    // Получаем только активных поставщиков
    const suppliers = await prisma.user.findMany({
      where: {
        role: "SUPPLIER",
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        supplierName: true
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
