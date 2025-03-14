// Скрипт для проверки доступных зон в базе данных
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAvailableZones() {
  try {
    console.log('Проверка доступных зон в базе данных...');
    
    // Получаем все зоны
    const allZones = await prisma.zone.findMany();
    console.log(`Всего зон в базе данных: ${allZones.length}`);
    
    // Считаем количество зон по статусам
    const statusCounts = {};
    for (const zone of allZones) {
      const status = zone.status || 'Без статуса';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
    
    console.log('Количество зон по статусам:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`- ${status}: ${count}`);
    }
    
    // Получаем доступные зоны
    const availableZones = await prisma.zone.findMany({
      where: { status: 'AVAILABLE' }
    });
    
    console.log(`\nДоступных зон (AVAILABLE): ${availableZones.length}`);
    
    if (availableZones.length === 0) {
      console.log('\nОбновляем статус некоторых зон на AVAILABLE...');
      
      // Обновляем статус первых 50 зон на AVAILABLE
      const zonesToUpdate = allZones.slice(0, 50);
      
      for (const zone of zonesToUpdate) {
        await prisma.zone.update({
          where: { id: zone.id },
          data: { status: 'AVAILABLE' }
        });
      }
      
      console.log(`Обновлено ${zonesToUpdate.length} зон на статус AVAILABLE`);
      
      // Проверяем снова
      const updatedAvailableZones = await prisma.zone.findMany({
        where: { status: 'AVAILABLE' }
      });
      
      console.log(`Теперь доступных зон (AVAILABLE): ${updatedAvailableZones.length}`);
    }
    
  } catch (error) {
    console.error('Ошибка при проверке доступных зон:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableZones().catch(console.error);
