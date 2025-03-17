import { PrismaClient, BookingStatus, RequestStatus } from '@prisma/client';
// We're not using createBookingRequest directly, so we can remove this import

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test bookings...');

    // Check if there are already bookings in the database
    const bookingCount = await prisma.booking.count();
    
    if (bookingCount > 0) {
      console.log(`${bookingCount} bookings already exist. Skipping test data creation.`);
      return;
    }

    // Get test users
    const categoryManager = await prisma.user.findFirst({
      where: { role: 'CATEGORY_MANAGER' },
    });

    const supplier = await prisma.user.findFirst({
      where: { role: 'SUPPLIER' },
    });

    const dmpManager = await prisma.user.findFirst({
      where: { role: 'DMP_MANAGER' },
    });

    if (!categoryManager || !supplier || !dmpManager) {
      console.error('Test users not found. Please run the seed script first.');
      return;
    }

    // Get some available zones
    const availableZones = await prisma.zone.findMany({
      where: { status: 'AVAILABLE' },
      take: 5,
    });

    if (availableZones.length === 0) {
      console.error('No available zones found. Please create some zones first.');
      return;
    }

    console.log(`Found ${availableZones.length} available zones.`);

    // Create a booking request from supplier
    const supplierBookingRequest = await prisma.bookingRequest.create({
      data: {
        userId: supplier.id,
        status: 'NEW' as RequestStatus,
      },
    });

    // Create bookings for the supplier request
    for (const zone of availableZones.slice(0, 2)) {
      await prisma.booking.create({
        data: {
          bookingRequestId: supplierBookingRequest.id,
          zoneId: zone.id,
          status: 'PENDING_KM' as BookingStatus,
        },
      });
    }

    // Create a booking request from category manager
    const kmBookingRequest = await prisma.bookingRequest.create({
      data: {
        userId: categoryManager.id,
        status: 'NEW' as RequestStatus,
        category: categoryManager.category,
      },
    });

    // Create bookings for the category manager request
    for (const zone of availableZones.slice(2, 4)) {
      await prisma.booking.create({
        data: {
          bookingRequestId: kmBookingRequest.id,
          zoneId: zone.id,
          status: 'KM_APPROVED' as BookingStatus,
        },
      });
    }

    // Create a booking request that's been approved by DMP
    const approvedBookingRequest = await prisma.bookingRequest.create({
      data: {
        userId: supplier.id,
        status: 'NEW' as RequestStatus,
      },
    });

    // Create a booking that's been approved by DMP
    if (availableZones.length >= 5) {
      await prisma.booking.create({
        data: {
          bookingRequestId: approvedBookingRequest.id,
          zoneId: availableZones[4].id,
          status: 'DMP_APPROVED' as BookingStatus,
        },
      });

      // Update the zone to be booked by the supplier
      await prisma.zone.update({
        where: { id: availableZones[4].id },
        data: {
          status: 'BOOKED',
          supplier: supplier.id,
        },
      });
    }

    console.log('Test bookings created successfully!');
  } catch (error) {
    console.error('Error creating test bookings:', error);
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
