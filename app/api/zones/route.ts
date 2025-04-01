import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchZones } from "@/lib/zones";
import { authOptions } from "@/lib/auth";
import { ZoneStatus } from "@/types/zone";
import { getCorrespondingMacrozones } from "@/lib/filterData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Read all potential filter arrays
    const city = searchParams.getAll("city");
    const market = searchParams.getAll("market");
    let macrozone = searchParams.getAll("macrozone"); // Keep let for category logic
    const equipment = searchParams.getAll("equipment");
    const supplier = searchParams.getAll("supplier");
    // Read single value filters
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") as ZoneStatus | null;
    // Read pagination
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    // Parse pagination parameters with defaults
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20; // Default page size

    // Validate parsed numbers
    const validPage = !isNaN(page) && page > 0 ? page : 1;
    const validPageSize = !isNaN(pageSize) && pageSize > 0 ? pageSize : 20;


    // If category is provided, get corresponding macrozones
    if (category) {
      const categoryMacrozones = getCorrespondingMacrozones(category);
      if (categoryMacrozones.length > 0) {
        // Combine with any explicitly requested macrozones and remove duplicates
        const combinedMacrozones = [...macrozone, ...categoryMacrozones];
        // Remove duplicates
        macrozone = combinedMacrozones.filter((value, index, self) =>
          self.indexOf(value) === index
        );
      }
    }

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

    console.log(`API zones: Роль пользователя: ${session.user.role}, статус для фильтрации: ${statusToUse || 'все'}`);

    console.log("API zones: Используемые параметры фильтрации:", {
      macrozone: macrozone.length > 0 ? macrozone : "не указано",
      status: statusToUse || "не указано"
    });

    // Construct parameters object for fetchZones
    const fetchParams = {
      city: city.length > 0 ? city : undefined,
      market: market.length > 0 ? market : undefined,
      macrozone: macrozone.length > 0 ? macrozone : undefined,
      equipment: equipment.length > 0 ? equipment : undefined,
      supplier: supplier.length > 0 ? supplier : undefined,
      // Pass category only if it was originally provided in the request
      category: category, // Already handled undefined case
      status: statusToUse,
      page: validPage,
      pageSize: validPageSize,
      // Add sorting params if API/DB function supports them
      // sortField: searchParams.get("sortField") || undefined,
      // sortDirection: searchParams.get("sortDirection") || undefined,
    };

    console.log("API zones: Calling fetchZones with params:", fetchParams);

    // Call fetchZones with the parameters object
    const { zones, totalCount } = await fetchZones(fetchParams);

    console.log(`API zones: Получено ${zones.length} зон (Всего: ${totalCount})`);
    // Avoid logging potentially large data in production
    // console.log('API zones: Data:', JSON.stringify(zones, null, 2));

    // Return the object containing zones and totalCount
    return NextResponse.json({ zones, totalCount });
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
}
