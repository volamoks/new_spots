import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to delete all zones...');

  try {
    console.log('Deleting all bookings first due to foreign key constraints...');
    const deleteBookingsResult = await prisma.booking.deleteMany({});
    console.log(`Successfully deleted ${deleteBookingsResult.count} bookings.`);

    console.log('Now deleting all zones...');
    const deleteZonesResult = await prisma.zone.deleteMany({});
    console.log(`Successfully deleted ${deleteZonesResult.count} zones.`);
  } catch (error) {
    console.error('Error deleting zones:', error);
    process.exit(1); // Exit with error code
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database.');
  }
}

main();