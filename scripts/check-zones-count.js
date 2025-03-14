const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZonesCount() {
  try {
    const count = await prisma.zone.count();
    console.log('Zone count:', count);
  } catch (error) {
    console.error('Error checking zone count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZonesCount();
