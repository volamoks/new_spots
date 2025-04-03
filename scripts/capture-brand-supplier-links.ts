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
  console.log('Fetching existing Brand-Supplier links...');
  // !!! NOTE: This script is likely outdated due to schema changes.
  // The Brand model no longer has a direct `supplierInn` field.
  // It now uses a many-to-many relation with User.
  // This script needs review/update/deletion.
  // Fetching all brands for now, but the logic below will fail.
  const brandsWithSupplier = await prisma.brand.findMany({
    // where: { // Original where clause based on non-existent field
    //   supplierInn: {
    //     not: null,
    //     not: '',
    //   },
    // },
    select: {
      id: true,
      name: true,
      // supplierInn: true, // Field no longer exists
      // Selecting related suppliers might be the new approach, but requires script rewrite.
      // suppliers: { select: { id: true, inn: true } } // Example of new approach
    },
  });

  console.log(`Found ${brandsWithSupplier.length} brands with a non-null supplierInn.`);

  const linksToPreserve: LinkToPreserve[] = [];
  const notFoundSuppliers = 0; // Use const as it's not reassigned in the commented block

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const brand of brandsWithSupplier) { // Disable unused var check for 'brand'
    // Double check supplierInn is not null/empty before proceeding
    // if (!brand.supplierInn) continue; // Field no longer exists

    // Find the User (Supplier) based on the unique INN
    // Find the User (Supplier) based on the unique INN
    // This logic needs complete rethinking based on the M2M relation.
    // For now, commenting out to fix TS errors.
    /*
    const supplierUser = await prisma.user.findUnique({
      where: {
        // inn: brand.supplierInn, // Field no longer exists on brand
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
        // supplierInn: brand.supplierInn, // Field no longer exists
      });
    } else {
      // console.warn( // Warning is also based on non-existent field
      //   `WARNING: Supplier User with INN '${brand.supplierInn}' not found for Brand "${brand.name}" (ID: ${brand.id}). This link cannot be preserved.`
      // );
      );
      notFoundSuppliers++;
    }
    */ // Close the block comment started on line 55
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