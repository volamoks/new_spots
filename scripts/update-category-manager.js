// Скрипт для обновления категории категорийного менеджера
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCategoryManager() {
  try {
    console.log('Обновление категорий категорийных менеджеров...');
    
    // Получаем все зоны
    const allZones = await prisma.zone.findMany();
    console.log(`Всего зон в базе данных: ${allZones.length}`);
    
    // Получаем уникальные категории
    const categories = [...new Set(allZones.map(zone => zone.category).filter(Boolean))];
    console.log('Уникальные категории зон:', categories);
    
    // Выбираем категорию с наибольшим количеством зон
    const categoryCounts = {};
    for (const zone of allZones) {
      if (zone.category) {
        categoryCounts[zone.category] = (categoryCounts[zone.category] || 0) + 1;
      }
    }
    
    // Сортируем категории по количеству зон
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
    
    console.log('Категории с наибольшим количеством зон:');
    for (let i = 0; i < Math.min(5, sortedCategories.length); i++) {
      const category = sortedCategories[i];
      console.log(`- ${category}: ${categoryCounts[category]} зон`);
    }
    
    // Выбираем первую категорию для обновления
    const categoryToUse = sortedCategories[0];
    console.log(`\nВыбрана категория для обновления: ${categoryToUse}`);
    
    // Получаем пользователей с ролью CATEGORY_MANAGER
    const categoryManagers = await prisma.user.findMany({
      where: { role: 'CATEGORY_MANAGER' }
    });
    
    console.log(`\nКатегорийные менеджеры (всего: ${categoryManagers.length}):`);
    for (const manager of categoryManagers) {
      console.log(`- ${manager.name || manager.email}: категория = ${manager.category || 'не указана'}`);
      
      // Обновляем категорию менеджера
      const updatedManager = await prisma.user.update({
        where: { id: manager.id },
        data: { category: categoryToUse }
      });
      
      console.log(`  Категория обновлена на: ${updatedManager.category}`);
    }
    
    console.log('\nОбновление завершено успешно!');
    
  } catch (error) {
    console.error('Ошибка при обновлении категорий менеджеров:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategoryManager().catch(console.error);
