import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchZones } from "@/lib/zones";
import { authOptions } from "@/lib/auth";
import { ZoneStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const macrozone = searchParams.get("macrozone");
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ZoneStatus | null;

    // Проверяем авторизацию
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Если запрашивают фильтрацию по категории, проверяем права
    if (category && session.user.role === "CATEGORY_MANAGER" && session.user.category !== category) {
      return NextResponse.json(
        { error: "Категорийный менеджер может видеть только зоны своей категории" },
        { status: 403 }
      );
    }

    // Если категорийный менеджер не указал категорию, используем его категорию
    const categoryToUse =
      session.user.role === "CATEGORY_MANAGER" && !category
        ? session.user.category
        : category;

    // Получаем зоны с учетом фильтров
    const zones = await fetchZones(macrozone || undefined, categoryToUse || undefined, status || undefined);

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
}
