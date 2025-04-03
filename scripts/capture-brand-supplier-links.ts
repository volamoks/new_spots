// scripts/capture-brand-supplier-links.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

// Ensure ts-node and necessary types are installed:
// npm install --save-dev ts-node @types/node @types/fs-extra
// or yarn add --dev ts-node @types/node @types/fs-extra
// (fs-extra might not be strictly needed if only using fs/promises)

const prisma = new PrismaClient();

interface LinkToPreserve {
  brandId: string;
  userId: string;
  brandName: string;
  supplierInn: string;
}

async function main() {
  console.log('Fetching existing Brand-Supplier links from Brand.supplierInn...');
  const brandsWithSupplier = await prisma.brand.findMany({
    where: {
      supplierInn: {
        not: null, // Only get brands that have a supplierInn
        not: '',   // Also exclude empty strings if applicable
      },
    },
    select: {
      id: true,
      name: true,
      supplierInn: true,
    },
  });

  console.log(`Found ${brandsWithSupplier.length} brands with a non-null supplierInn.`);

  const linksToPreserve: LinkToPreserve[] = [];
  let notFoundSuppliers = 0;

  for (const brand of brandsWithSupplier) {
    // Double check supplierInn is not null/empty before proceeding
    if (!brand.supplierInn) continue;

    // Find the User (Supplier) based on the unique INN
    const supplierUser = await prisma.user.findUnique({
      where: {
        inn: brand.supplierInn,
        // You might want to add role: Role.SUPPLIER here if INNs are not globally unique
      },
      select: {
        id: true, // We only need the ID to create the link
      },
    });

    if (supplierUser) {
      linksToPreserve.push({
        brandId: brand.id,
        userId: supplierUser.id,
        brandName: brand.name,
        supplierInn: brand.supplierInn, // Keep for logging/reference
      });
    } else {
      console.warn(
        `WARNING: Supplier User with INN '${brand.supplierInn}' not found for Brand "${brand.name}" (ID: ${brand.id}). This link cannot be preserved.`
      );
      notFoundSuppliers++;
    }
  }

  const filePath = './brand-supplier-links.json';
  try {
    await fs.writeFile(filePath, JSON.stringify(linksToPreserve, null, 2));
    console.log(`\nSuccessfully found ${linksToPreserve.length} valid links.`);
    if (notFoundSuppliers > 0) {
      console.warn(
        `${notFoundSuppliers} suppliers could not be found based on their INN stored in Brand.supplierInn.`
      );
    }
    console.log(`Preserved links saved to ${filePath}`);
    console.log('\nNEXT STEP: Run the database migration (`npx prisma migrate dev ...`).');
    console.log('AFTER migration, run the `scripts/restore-brand-supplier-links.ts` script.');

  } catch (error) {
      console.error(`Error writing links to ${filePath}:`, error);
      process.exit(1); // Exit if we can't save the links
  }
}

main()
  .catch((e) => {
    console.error('An error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });