import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchZones } from "@/lib/zones";
import { authOptions } from "@/lib/auth";
import { ZoneStatus } from "@/types/zone";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const macrozone = searchParams.getAll("macrozone");
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ZoneStatus | null;

    console.log("API zones: Получен запрос с параметрами:", {
      macrozone: macrozone.length > 0 ? macrozone : "не указано",
      category: category || "не указано",
      status: status || "не указано"
    });

    // Проверяем авторизацию
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("API zones: Ошибка авторизации - сессия отсутствует");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API zones: Сессия пользователя:", {
      id: session.user.id,
      role: session.user.role,
      category: session.user.category || "не указано"
    });

    // Определяем статус для фильтрации
    // Для поставщика показываем только доступные зоны
    // Для категорийного менеджера показываем все доступные зоны (как для поставщика)
    const statusToUse = 
      (session.user.role === "SUPPLIER" || session.user.role === "CATEGORY_MANAGER")
        ? ZoneStatus.AVAILABLE 
        : status || undefined;
    
    // Используем категорию только если она явно указана в запросе
    // Для категорийного менеджера не фильтруем по категории автоматически
    const categoryToUse = category;
    
    console.log(`API zones: Роль пользователя: ${session.user.role}, статус для фильтрации: ${statusToUse || 'все'}`);

    console.log("API zones: Используемые параметры фильтрации:", {
      macrozone: macrozone.length > 0 ? macrozone : "не указано",
      category: categoryToUse || "не указано",
      status: statusToUse || "не указано"
    });

    // Получаем зоны с учетом фильтров
    const zones = await fetchZones(macrozone, categoryToUse || undefined, statusToUse);
    
    console.log(`API zones: Получено ${zones.length} зон`);
    console.log('API zones: Data:', JSON.stringify(zones, null, 2)); // Log the data

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
}
