import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Проверяем, есть ли уже пользователи в базе данных
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('Создание тестовых пользователей...');
      
      // Создаем тестового пользователя с ролью DMP_MANAGER
      await prisma.user.create({
        data: {
          name: 'DMP Manager',
          email: 'dmp@example.com',
          password: await hash('password123', 10),
          role: 'DMP_MANAGER',
          status: 'ACTIVE',
        },
      });
      
      // Создаем тестового пользователя с ролью CATEGORY_MANAGER
      await prisma.user.create({
        data: {
          name: 'Category Manager',
          email: 'category@example.com',
          password: await hash('password123', 10),
          role: 'CATEGORY_MANAGER',
          status: 'ACTIVE',
          category: 'Тестовая категория',
        },
      });
      
      // Создаем тестового пользователя с ролью SUPPLIER
      await prisma.user.create({
        data: {
          name: 'Supplier',
          email: 'supplier@example.com',
          password: await hash('password123', 10),
          role: 'SUPPLIER',
          status: 'ACTIVE',
          inn: '1234567890',
        },
      });
      
      console.log('Тестовые пользователи созданы успешно!');
    } else {
      console.log('Пользователи уже существуют, пропускаем создание тестовых данных.');
    }
  } catch (error) {
    console.error('Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });