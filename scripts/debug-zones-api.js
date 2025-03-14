// Скрипт для отладки API запросов к зонам
const fetch = require('node-fetch');

async function debugZonesApi() {
  try {
    console.log('Отладка API запросов к зонам...');
    
    // Получаем сессию пользователя
    console.log('Получение сессии пользователя...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const session = await sessionResponse.json();
    console.log('Сессия пользователя:', session);
    
    // Получаем зоны без фильтров
    console.log('\nПолучение зон без фильтров...');
    const zonesResponse = await fetch('http://localhost:3000/api/zones', {
      headers: {
        'Cookie': sessionResponse.headers.get('set-cookie') || ''
      }
    });
    
    console.log('Статус ответа:', zonesResponse.status);
    console.log('Заголовки ответа:', zonesResponse.headers);
    
    const zones = await zonesResponse.json();
    console.log(`Получено ${zones.length} зон`);
    
    // Получаем зоны с фильтром по статусу AVAILABLE
    console.log('\nПолучение зон со статусом AVAILABLE...');
    const availableZonesResponse = await fetch('http://localhost:3000/api/zones?status=AVAILABLE', {
      headers: {
        'Cookie': sessionResponse.headers.get('set-cookie') || ''
      }
    });
    
    const availableZones = await availableZonesResponse.json();
    console.log(`Получено ${availableZones.length} доступных зон`);
    
    // Выводим первые 5 зон для проверки
    if (availableZones.length > 0) {
      console.log('\nПримеры доступных зон:');
      for (let i = 0; i < Math.min(5, availableZones.length); i++) {
        const zone = availableZones[i];
        console.log(`- ID: ${zone.uniqueIdentifier}, Город: ${zone.city}, Магазин: ${zone.market}, Категория: ${zone.category || 'не указана'}`);
      }
    }
    
    // Проверяем, есть ли зоны с категорией пользователя
    if (session?.user?.category) {
      const userCategory = session.user.category;
      console.log(`\nПроверка зон с категорией пользователя: ${userCategory}`);
      
      const categoryZones = availableZones.filter(zone => zone.category === userCategory);
      console.log(`Найдено ${categoryZones.length} зон с категорией ${userCategory}`);
      
      if (categoryZones.length > 0) {
        console.log('Примеры зон с категорией пользователя:');
        for (let i = 0; i < Math.min(5, categoryZones.length); i++) {
          const zone = categoryZones[i];
          console.log(`- ID: ${zone.uniqueIdentifier}, Город: ${zone.city}, Магазин: ${zone.market}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Ошибка при отладке API запросов:', error);
  }
}

debugZonesApi().catch(console.error);
