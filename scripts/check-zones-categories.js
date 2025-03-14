// Скрипт для проверки категорий зон в базе данных
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZonesCategories() {
  try {
    console.log('Проверка категорий зон в базе данных...');
    
    // Получаем все зоны
    const allZones = await prisma.zone.findMany();
    console.log(`Всего зон в базе данных: ${allZones.length}`);
    
    // Получаем уникальные категории
    const categories = [...new Set(allZones.map(zone => zone.category).filter(Boolean))];
    console.log('Уникальные категории зон:', categories);
    
    // Считаем количество зон по категориям
    const categoryCounts = {};
    for (const zone of allZones) {
      const category = zone.category || 'Без категории';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    
    console.log('Количество зон по категориям:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`- ${category}: ${count}`);
    }
    
    // Получаем пользователей с ролью CATEGORY_MANAGER
    const categoryManagers = await prisma.user.findMany({
      where: { role: 'CATEGORY_MANAGER' }
    });
    
    console.log(`\nКатегорийные менеджеры (всего: ${categoryManagers.length}):`);
    for (const manager of categoryManagers) {
      console.log(`- ${manager.name || manager.email}: категория = ${manager.category || 'не указана'}`);
      
      // Проверяем, есть ли зоны для этой категории
      if (manager.category) {
        const zonesForCategory = await prisma.zone.count({
          where: { category: manager.category }
        });
        console.log(`  Зон для категории ${manager.category}: ${zonesForCategory}`);
      }
    }
    
    // Проверяем текущую сессию пользователя
    console.log('\nПроверка сессии пользователя...');
    const sessions = await prisma.session.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Активных сессий: ${sessions.length}`);
    for (const session of sessions) {
      console.log(`- Пользователь: ${session.user.name || session.user.email}`);
      console.log(`  Роль: ${session.user.role}`);
      console.log(`  Категория: ${session.user.category || 'не указана'}`);
      
      if (session.user.role === 'CATEGORY_MANAGER' && session.user.category) {
        const zonesForCategory = await prisma.zone.count({
          where: { category: session.user.category }
        });
        console.log(`  Зон для категории ${session.user.category}: ${zonesForCategory}`);
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке категорий зон:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZonesCategories().catch(console.error);
