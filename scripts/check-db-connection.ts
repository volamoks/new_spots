import { PrismaClient } from '@prisma/client';

async function checkDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Проверка подключения к базе данных...');
    
    // Попытка выполнить простой запрос к базе данных
    const userCount = await prisma.user.count();
    console.log(`Подключение успешно! Количество пользователей в базе данных: ${userCount}`);
    
    // Проверка версии Prisma
    try {
      // @ts-expect-error - доступ к внутреннему свойству для диагностики
      const clientVersion = prisma['_clientVersion'] || 'неизвестно';
      console.log('Версия Prisma Client:', clientVersion);
    } catch {
      console.log('Не удалось определить версию Prisma Client');
    }
    
    // Проверка URL базы данных (без отображения пароля)
    const dbUrl = process.env.DATABASE_URL || 'не задан';
    const maskedUrl = dbUrl.replace(/:\/\/.*@/, '://***:***@');
    console.log('URL базы данных:', maskedUrl);
    
    return true;
  } catch (error) {
    console.error('Ошибка подключения к базе данных:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск проверки
checkDatabaseConnection()
  .then((success) => {
    if (success) {
      console.log('Проверка завершена успешно!');
      process.exit(0);
    } else {
      console.error('Проверка завершена с ошибками!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Непредвиденная ошибка:', error);
    process.exit(1);
  });