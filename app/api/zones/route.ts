import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchZones } from "@/lib/zones";
import { authOptions } from "@/lib/auth";
import { ZoneStatus } from "@/types/zone";
import { getCorrespondingMacrozones } from "@/lib/filterData";
import redis from '@/lib/redis'; // Import Redis client
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Read all potential filter arrays
    const city = searchParams.getAll("city");
    const market = searchParams.getAll("market");
    // Removed unused 'macrozone' variable declaration
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


    // Determine the final macrozones to use based on category and explicit filters
    let macrozonesToUse: string[] | undefined = undefined;
    const explicitMacrozones = searchParams.getAll("macrozone"); // Get explicitly selected macrozones

    if (explicitMacrozones.length > 0) {
      // If explicit macrozones are selected, use them directly, overriding category logic for filtering
      macrozonesToUse = explicitMacrozones;
    } else if (category) {
      // If no explicit macrozones are selected, but a category is, use the category's corresponding macrozones
      macrozonesToUse = getCorrespondingMacrozones(category);
    }
    // If neither explicit macrozones nor a category with corresponding macrozones are provided,
    // macrozonesToUse remains undefined, and no macrozone filter is applied.

    // Replace the original 'macrozone' variable with 'macrozonesToUse' for clarity later
    // Note: The original 'macrozone' variable is no longer needed after this block.

    console.log("API zones: Получен запрос с параметрами:", {
      macrozone: macrozonesToUse && macrozonesToUse.length > 0 ? macrozonesToUse : "не указано",
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
      macrozone: macrozonesToUse && macrozonesToUse.length > 0 ? macrozonesToUse : "не указано",
      status: statusToUse || "не указано"
    });

    // Construct parameters object for fetchZones
    const fetchParams = {
      city: city.length > 0 ? city : undefined,
      market: market.length > 0 ? market : undefined,
      macrozone: macrozonesToUse, // Pass the calculated macrozonesToUse
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

    // --- Redis Caching Logic ---
    const cacheTTL = 86400; // Cache for 24 hours
    // Create a stable key: sort array params and stringify the relevant parts of fetchParams
    const keyParams = { ...fetchParams };
    for (const key in keyParams) {
      if (Array.isArray(keyParams[key as keyof typeof keyParams])) {
        (keyParams[key as keyof typeof keyParams] as string[]).sort();
      }
    }
    const cacheKey = `zones:${JSON.stringify(keyParams)}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for zones key: ${cacheKey.substring(0, 100)}...`); // Log truncated key
        return NextResponse.json(JSON.parse(cachedData));
      }
      console.log(`Cache miss for zones key: ${cacheKey.substring(0, 100)}...`);
    } catch (redisError) {
      console.error(`Redis GET error for zones key ${cacheKey.substring(0, 100)}...:`, redisError);
      // Proceed to fetch from DB if Redis fails
    }
    // --- End Redis Caching Logic ---

    // Call fetchZones with the parameters object
    const result = await fetchZones(fetchParams); // Contains { zones, totalCount }

    console.log(`API zones: Получено ${result.zones.length} зон (Всего: ${result.totalCount})`);
    // Avoid logging potentially large data in production
    // console.log('API zones: Data:', JSON.stringify(result, null, 2));

    // --- Store in Redis ---
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', cacheTTL);
      console.log(`Cached zones data for key: ${cacheKey.substring(0, 100)}...`);
    } catch (redisError) {
      console.error(`Redis SET error for zones key ${cacheKey.substring(0, 100)}...:`, redisError);
      // Don't fail the request if caching fails
    }
    // --- End Store in Redis ---

    // Return the object containing zones and totalCount
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
}
