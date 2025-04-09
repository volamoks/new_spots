import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone";
import { Role, Prisma } from "@prisma/client"; // Import Role, Prisma types, and Prisma namespace (Removed unused Zone, InnOrganization, Brand)
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Общий интерфейс для данных из Excel
interface ExcelData {
  [key: string]: string | number | null | undefined;
}

// Интерфейс для данных зон
interface ZoneData extends ExcelData {
  "Уникальный идентификатор"?: string;
  "Область"?: string;
  "Город"?: string;
  "№"?: string;
  "Маркет"?: string;
  "Формат маркета"?: string;
  "Формат оборудования"?: string;
  "Оборудование"?: string;
  "Цена"?: string | number;
  "ID"?: string;
  "Габариты"?: string;
  "Сектор"?: string;
  "КМ"?: string;
  "Основная Макрозона"?: string;
  "Смежная макрозона"?: string;
  "Товарное соседство ДМП"?: string;
  "Назначение"?: string;
  "Подназначение"?: string;
  "Категория"?: string;
  "Поставщик"?: string | null;
  "Brand"?: string | null;
  "Категория товара"?: string | null;
  "Статус"?: string;
}

// Интерфейс для данных ИНН
interface InnData extends ExcelData {
  "Поставщик"?: string;
  "Налоговый номер"?: string;
}

// Интерфейс для данных Брендов
interface BrandData extends ExcelData {
  "Название Бренда"?: string; // Brand Name
  "ИНН Поставщика"?: string; // Optional Supplier INN
}

export async function POST(req: NextRequest) {
  try {
    // --- Authentication & Authorization Check ---
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== Role.DMP_MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Only DMP Managers can upload data." },
        { status: 403 }
      )
    }
    // --- End Check ---

    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || req.nextUrl.searchParams.get("type") || "zones"

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    // Read the workbook with specific options
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      codepage: 65001, // UTF-8
      cellDates: true,
      raw: true,
    })

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // Get the range and find headers
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1")
    console.log(`[Data Reading] Detected sheet range: ${JSON.stringify(range)}`); // Log the detected range
    const headers: { [key: string]: number } = {}

    // First, collect all headers and clean them
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: range.s.r, c: C })
      const cell = worksheet[address]
      if (cell && cell.v) {
        const headerName = cell.v
          .toString()
          .replace(/["\n\r]/g, "") // Remove quotes and line breaks
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .trim() // Remove leading/trailing spaces

        headers[headerName] = C

        // Update the cell value with cleaned header
        cell.v = headerName
        cell.w = headerName
      }
    }

    // Debug: Log all headers we found
    console.log("Found headers:", headers)

    // Convert to array of rows
    const data: ExcelData[] = []
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row: ExcelData = {}
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = worksheet[address]
        const headerAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C })
        const headerCell = worksheet[headerAddress]

        if (headerCell && headerCell.v) {
          const headerName = headerCell.v.toString()
          // Attempt to parse numbers if header suggests it (e.g., "Цена")
          // Be cautious with this, might need refinement based on actual headers
          if (headerName === "Цена" && cell && typeof cell.v === 'string' && !isNaN(parseFloat(cell.v))) {
            row[headerName] = parseFloat(cell.v);
          } else {
            row[headerName] = cell ? cell.v : null
          }
        }
      }
      data.push(row)
    }
    console.log(`[Data Reading] Populated data array with ${data.length} rows.`); // Log the size of the data array

    // Validate data based on type
    const validationErrors: string[] = []

    let dataToProcess = data; // Use original data by default

    if (type === "zones") {
      // Filter rows for 'zones' type first
      const filteredData = data.filter(row =>
        row["Поставщик"] && row["Brand"] && row["Категория товара"]
      );
      dataToProcess = filteredData; // Use filtered data for validation and saving

      // Validate the filtered data
      dataToProcess.forEach((row, index) => {
        // Note: rowNum might not correspond to original Excel row anymore if rows are filtered.
        // Consider if this index needs adjustment or if error messages should change.
        const rowNum = index + 2 // Placeholder, might need adjustment based on how you want to report errors for filtered data.

        if (!row["Уникальный идентификатор"]) {
          validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует уникальный идентификатор`)
        }
        if (!row["Город"]) {
          validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует город`)
        }
        if (!row["Маркет"]) {
          validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует маркет`)
        }
        if (!row["Основная Макрозона"]) {
          validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует основная макрозона`)
        }
      })
    } else if (type === "inn") {
      // Validate all data for 'inn' type
      dataToProcess.forEach((row, index) => {
        const rowNum = index + 2 // +2 because Excel starts from 1 and we have header row

        if (!row["Поставщик"]) {
          validationErrors.push(`Строка ${rowNum}: Отсутствует название поставщика`)
        }
        if (!row["Налоговый номер"]) {
          validationErrors.push(`Строка ${rowNum}: Отсутствует ИНН`)
        }
      })
    } else if (type === "brands") {
      // Validate all data for 'brands' type
      console.log(`[Brands Path] Validating ${dataToProcess.length} rows for brands.`); // Log count before validation
      dataToProcess.forEach((row, index) => {
        const rowNum = index + 2 // +2 because Excel starts from 1 and we have header row

        if (!row["Название Бренда"]) {
          validationErrors.push(`Строка ${rowNum}: Отсутствует Название Бренда`)
        }
        // Optional: Add validation for INN format if provided
        // if (row["ИНН Поставщика"] && !/^\d{10,12}$/.test(String(row["ИНН Поставщика"]))) {
        //   validationErrors.push(`Строка ${rowNum}: Некорректный формат ИНН Поставщика`)
        // }
      })
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Ошибки валидации",
          details: validationErrors,
          // Debug: Include first row of the *original* data in error response
          firstRow: data[0],
        },
        { status: 400 },
      )
    }

    // --- Batch Save Logic ---
    let savedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const rowsAttempted = dataToProcess.length;

    if (type === "zones") {
      const { created, updated, failed } = await batchUpsertZones(dataToProcess as ZoneData[]);
      savedCount = created;
      updatedCount = updated;
      failedCount = failed;
      console.log(`[Zones Batch] Processed ${rowsAttempted} rows. Created: ${savedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`);

    } else if (type === "inn") {
      // Keep original Promise.allSettled for INN for now, or implement batching similarly
      // Also, update to use upsert for consistency
      const results = await Promise.allSettled(dataToProcess.map(row => createOrUpdateSupplier(row as InnData)));
      savedCount = results.filter(r => r.status === 'fulfilled').length; // Simplified count
      failedCount = results.filter(r => r.status === 'rejected').length;
      console.log(`[INN Path] Processed ${results.length} rows. Succeeded: ${savedCount}, Failed: ${failedCount}`);
      // Note: This doesn't distinguish between created/updated for INN

    } else if (type === "brands") {
      // Keep original Promise.all for Brands for now, or implement batching similarly
      // Also, update to use upsert for consistency
      console.log(`[Brands Path] Attempting to save ${dataToProcess.length} brand rows.`);
      const results = await Promise.all(dataToProcess.map(async (row, index) => {
        try {
          const result = await createOrUpdateBrand(row as BrandData);
          return { status: 'fulfilled', value: result, rowNum: index + 2 };
        } catch (error) {
          console.error(`[Brands Path] Error processing row ${index + 2}:`, error);
          return { status: 'rejected', reason: error, rowNum: index + 2 };
        }
      }));
      savedCount = results.filter(r => r.status === 'fulfilled').length; // Simplified count
      failedCount = results.filter(r => r.status === 'rejected').length;
      console.log(`[Brands Path] Successfully processed ${savedCount} brand rows.`);
      if (failedCount > 0) {
        console.warn(`[Brands Path] Failed to save ${failedCount} brand rows.`);
      }
      // Note: This doesn't distinguish between created/updated for Brands
    } else {
      return NextResponse.json({ error: "Неизвестный тип импорта" }, { status: 400 })
    }

    // Construct the response with detailed statistics
    // Construct the response with detailed statistics
    return NextResponse.json({
      message: `Обработка завершена. Успешно создано/обновлено: ${savedCount + updatedCount}, Ошибки: ${failedCount}.`,
      totalRowsRead: data.length,
      rowsAttempted: rowsAttempted,
      rowsCreated: type === "zones" ? savedCount : undefined, // Provide specific counts if available
      rowsUpdated: type === "zones" ? updatedCount : undefined,
      rowsSucceeded: savedCount + updatedCount, // General success count
      rowsFailed: failedCount,
    });
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error)
    return NextResponse.json({
      error: "Произошла ошибка при обработке файла",
      details: (error as Error).message,
    }, { status: 500 })
  }
}

// --- Helper function to format zone data for Prisma ---
function formatZoneData(zoneData: ZoneData): Omit<Prisma.ZoneCreateInput, 'uniqueIdentifier'> {
  const status = getZoneStatus(zoneData["Статус"] || "");
  let price: number | undefined = undefined;
  if (zoneData["Цена"] !== undefined && zoneData["Цена"] !== null) {
    price = typeof zoneData["Цена"] === 'number'
      ? zoneData["Цена"]
      : parseFloat(String(zoneData["Цена"])); // Ensure string conversion before parseFloat
    if (isNaN(price)) {
      price = undefined;
    }
  }

  return {
    city: zoneData["Город"] || "",
    number: zoneData["№"] || "",
    market: zoneData["Маркет"] || "",
    newFormat: zoneData["Формат маркета"] || "",
    equipment: zoneData["Оборудование"] || "",
    dimensions: zoneData["Габариты"] !== undefined && zoneData["Габариты"] !== null ? String(zoneData["Габариты"]) : "",
    mainMacrozone: zoneData["Основная Макрозона"] || "",
    adjacentMacrozone: zoneData["Смежная макрозона"] || "",
    status: status,
    supplier: zoneData["Поставщик"] || null,
    brand: zoneData["Brand"] || null,
    category: zoneData["Категория товара"] || null,
    region: zoneData["Область"] || null,
    equipmentFormat: zoneData["Формат оборудования"] || null,
    price: price,
    externalId: zoneData["ID"] || null,
    sector: zoneData["Сектор"] || null,
    km: zoneData["КМ"] !== undefined && zoneData["КМ"] !== null ? String(zoneData["КМ"]) : null,
    dmpNeighborhood: zoneData["Товарное соседство ДМП"] || null,
    purpose: zoneData["Назначение"] || null,
    subpurpose: zoneData["Подназначение"] || null,
  };
}


// --- Batch Upsert Logic for Zones ---
async function batchUpsertZones(zoneDataArray: ZoneData[]) {
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const zonesToCreate: Prisma.ZoneCreateManyInput[] = [];
  const updatesToPerform: { uniqueIdentifier: string; data: Omit<Prisma.ZoneUpdateInput, 'uniqueIdentifier'> }[] = [];

  const uniqueIdentifiers = zoneDataArray
    .map(z => z["Уникальный идентификатор"])
    .filter((id): id is string => !!id); // Filter out null/undefined IDs

  if (uniqueIdentifiers.length === 0) {
    console.warn("[Zones Batch] No valid unique identifiers found in the data to process.");
    return { created: 0, updated: 0, failed: zoneDataArray.length };
  }

  try {
    // 1. Find existing zones
    const existingZones = await prisma.zone.findMany({
      where: { uniqueIdentifier: { in: uniqueIdentifiers } },
      select: { uniqueIdentifier: true },
    });
    const existingIdentifiers = new Set(existingZones.map(z => z.uniqueIdentifier));

    // 2. Separate data into create and update lists
    for (const zoneData of zoneDataArray) {
      const uniqueIdentifier = zoneData["Уникальный идентификатор"];
      if (!uniqueIdentifier) {
        console.warn("[Zones Batch] Skipping row due to missing unique identifier:", zoneData);
        failedCount++;
        continue;
      }

      const formattedData = formatZoneData(zoneData);

      if (existingIdentifiers.has(uniqueIdentifier)) {
        updatesToPerform.push({ uniqueIdentifier, data: formattedData });
      } else {
        zonesToCreate.push({ uniqueIdentifier, ...formattedData });
      }
    }

    // 3. Perform batch create
    if (zonesToCreate.length > 0) {
      try {
        const createResult = await prisma.zone.createMany({
          data: zonesToCreate,
          skipDuplicates: true, // Skip if a duplicate uniqueIdentifier somehow exists despite our check
        });
        createdCount = createResult.count;
        console.log(`[Zones Batch] Created ${createdCount} new zones.`);
      } catch (error) {
        console.error("[Zones Batch] Error during createMany:", error);
        // Assume all creates failed in this batch if createMany throws
        failedCount += zonesToCreate.length;
      }
    }

    // 4. Perform updates individually (within Promise.allSettled for better error handling)
    if (updatesToPerform.length > 0) {
      console.log(`[Zones Batch] Attempting to update ${updatesToPerform.length} existing zones.`);
      const updateResults = await Promise.allSettled(
        updatesToPerform.map(update =>
          prisma.zone.update({
            where: { uniqueIdentifier: update.uniqueIdentifier },
            data: update.data,
          }).catch(err => {
            // Catch errors within the map to prevent Promise.allSettled from masking them
            console.error(`[Zones Batch] Failed to update zone ${update.uniqueIdentifier}:`, err);
            throw err; // Re-throw to mark the promise as rejected
          })
        )
      );

      updateResults.forEach((result) => { // Removed unused index
        if (result.status === 'fulfilled') {
          updatedCount++;
        } else {
          failedCount++;
          // Error already logged in the catch block above
        }
      });
      console.log(`[Zones Batch] Updated ${updatedCount} zones. Failed updates: ${updatesToPerform.length - updatedCount}.`);
    }

  } catch (error) {
    console.error("[Zones Batch] General error during batch upsert process:", error);
    // If the initial findMany fails, assume all rows failed
    if (createdCount === 0 && updatedCount === 0) {
      failedCount = zoneDataArray.length;
    } else {
      // If findMany succeeded but something else failed later,
      // adjust failedCount based on already processed counts.
      // This might overestimate failures if some updates succeeded before a later error.
      failedCount = zoneDataArray.length - createdCount - updatedCount;
    }
  }

  // Ensure failedCount doesn't exceed total rows attempted
  failedCount = Math.min(failedCount, zoneDataArray.length);


  return { created: createdCount, updated: updatedCount, failed: failedCount };
}


// Removed unused createOrUpdateZone function as it's replaced by batchUpsertZones
async function createOrUpdateSupplier(innData: InnData) {
  // ... (original implementation remains, but updated to use upsert) ...
  const inn = innData["Налоговый номер"]?.toString() || "";
  const organizationName = innData["Поставщик"]?.toString() || "";

  if (!inn) throw new Error("ИНН обязателен");
  if (!organizationName) throw new Error("Название поставщика обязательно");

  try {
    // Use upsert for simplicity and atomicity
    return await prisma.innOrganization.upsert({
      where: { inn },
      update: { name: organizationName },
      create: { inn, name: organizationName },
    });
  } catch (error) {
    console.error("Ошибка при сохранении организации:", error);
    console.error("Данные организации:", { inn, organizationName });
    throw error;
  }
}

async function createOrUpdateBrand(brandData: BrandData) {
  // ... (original implementation remains, but updated to use upsert and better error check) ...
  const brandName = brandData["Название Бренда"]?.toString().trim();
  const supplierInnsString = brandData["ИНН Поставщика"]?.toString().trim() || "";

  if (!brandName) throw new Error("Название бренда обязательно");

  const supplierInns = supplierInnsString.split(',').map(inn => inn.trim()).filter(inn => inn.length > 0);

  const suppliersToConnect = await prisma.user.findMany({
    where: { inn: { in: supplierInns }, role: 'SUPPLIER' },
    select: { id: true },
  });

  if (supplierInns.length > 0 && suppliersToConnect.length !== supplierInns.length) {
    console.warn(`[Brand Upload] For brand "${brandName}", some supplier INNs were not found or did not correspond to a SUPPLIER user: ${supplierInns.join(', ')}. Found ${suppliersToConnect.length} valid suppliers.`);
  }

  const connectData = suppliersToConnect.map(supplier => ({ id: supplier.id }));

  try {
    // Use upsert for simplicity and atomicity
    return await prisma.brand.upsert({
      where: { name: brandName },
      update: { suppliers: { set: connectData } }, // Use set to replace existing connections
      create: { name: brandName, suppliers: { connect: connectData } },
    });
  } catch (error) {
    console.error(`Ошибка при сохранении бренда "${brandName}":`, error);
    console.error("Данные бренда:", { brandName, supplierInns, connectData });
    // Check specifically for Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error(`Brand name "${brandName}" might already exist (unique constraint violation).`);
    }
    throw error;
  }
}

function getZoneStatus(status: string): ZoneStatus {
  switch (status?.toLowerCase()) {
    case "свободно":
      return ZoneStatus.AVAILABLE
    case "забронировано":
      return ZoneStatus.BOOKED
    default:
      return ZoneStatus.UNAVAILABLE
  }
}
