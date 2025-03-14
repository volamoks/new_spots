import { prisma } from "./prisma";
import { ZoneStatus } from "@/types/zone";

/**
 * Получает зоны по различным параметрам фильтрации
 * @param macrozone Макрозона (опционально)
 * @param category Категория (опционально)
 * @param status Статус зоны (опционально)
 * @returns Список зон, соответствующих фильтрам
 */
export const fetchZones = async (macrozone?: string | string[], category?: string, status?: ZoneStatus) => {
  try {
    // Строим условие where на основе предоставленных параметров
    const whereClause: any = {};

    if (macrozone && (Array.isArray(macrozone) ? macrozone.length > 0 : true)) {
      const macrozoneArray = Array.isArray(macrozone) ? macrozone : [macrozone];
      whereClause.OR = macrozoneArray.map(mz => ({ mainMacrozone: mz }));
    }

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    console.log("fetchZones: whereClause =", JSON.stringify(whereClause));

    // Если whereClause пустой (нет фильтров), не добавляем его в запрос
    const query = Object.keys(whereClause).length > 0 
      ? {
          where: whereClause,
          orderBy: [
            { city: 'asc' },
            { market: 'asc' }
          ],
        }
      : {
          orderBy: [
            { city: 'asc' },
            { market: 'asc' }
          ],
        };

    const zones = await prisma.zone.findMany({
      ...(Object.keys(whereClause).length > 0 ? { where: whereClause } : {}),
      orderBy: [
        { city: 'asc' },
        { market: 'asc' }
      ]
    });

    console.log(`fetchZones: Найдено ${zones.length} зон`);
    
    return zones;
  } catch (error) {
    console.error("Error fetching zones:", error);
    return [];
  }
};

/**
 * Обновляет статус указанной зоны
 * @param id Идентификатор зоны
 * @param status Новый статус зоны
 * @returns Обновленная зона или null в случае ошибки
 */
export const updateZoneStatus = async (id: string, status: ZoneStatus) => {
  try {
    const updatedZone = await prisma.zone.update({
      where: { id },
      data: { status },
    });
    return updatedZone;
  } catch (error) {
    console.error("Error updating zone status:", error);
    throw error;
  }
};
