import { prisma } from "../lib/prisma";

async function checkZones() {
  try {
    // Получаем количество зон в базе данных
    const zonesCount = await prisma.zone.count();
    console.log(`Количество зон в базе данных: ${zonesCount}`);

    // Получаем первые 5 зон для проверки
    const zones = await prisma.zone.findMany({
      take: 5,
    });
    
    console.log("Примеры зон:");
    console.log(JSON.stringify(zones, null, 2));
  } catch (error) {
    console.error("Ошибка при проверке зон:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZones();
