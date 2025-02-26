import { prisma } from "./prisma";
import { ZoneStatus } from "@/types/zone";

/**
 * Получает зоны по различным параметрам фильтрации
 * @param macrozone Макрозона (опционально)
 * @param category Категория (опционально)
 * @param status Статус зоны (опционально)
 * @returns Список зон, соответствующих фильтрам
 */
export const fetchZones = async (macrozone?: string, category?: string, status?: ZoneStatus) => {
  try {
    // Строим условие where на основе предоставленных параметров
    const whereClause: {
      mainMacrozone?: string;
      category?: string;
      status?: ZoneStatus;
    } = {};
    
    if (macrozone) {
      whereClause.mainMacrozone = macrozone;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const zones = await prisma.zone.findMany({
      where: whereClause,
      orderBy: [
        { city: 'asc' },
        { market: 'asc' }
      ],
    });
    
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
