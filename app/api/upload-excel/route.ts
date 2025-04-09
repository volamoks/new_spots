import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone";
import { Role, Zone, InnOrganization, Brand } from "@prisma/client"; // Import Role and Prisma types
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
          row[headerName] = cell ? cell.v : null
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

    // Save data to database based on type using the potentially filtered data
    let results;
    let savedData = [];
    let failedCount = 0;
    const rowsAttempted = dataToProcess.length; // Rows that passed initial validation

    if (type === "zones") {
      results = await Promise.allSettled(dataToProcess.map(row => createOrUpdateZone(row as ZoneData)));
      savedData = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<Zone>).value);
      failedCount = results.filter(r => r.status === 'rejected').length;
      console.log(`[Zones Path] Processed ${results.length} rows. Succeeded: ${savedData.length}, Failed: ${failedCount}`);
    } else if (type === "inn") {
      // For 'inn', dataToProcess is the original 'data'
      results = await Promise.allSettled(dataToProcess.map(row => createOrUpdateSupplier(row as InnData)));
      savedData = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<InnOrganization>).value);
      failedCount = results.filter(r => r.status === 'rejected').length;
      console.log(`[INN Path] Processed ${results.length} rows. Succeeded: ${savedData.length}, Failed: ${failedCount}`);
    } else if (type === "brands") {
      // For 'brands', dataToProcess is the original 'data'
      console.log(`[Brands Path] Attempting to save ${dataToProcess.length} brand rows.`); // Log count before saving
      // Use Promise.allSettled or map with individual try/catch to handle row errors (already done)
      results = await Promise.all(dataToProcess.map(async (row, index) => {
        try {
          // console.log(`[Brands Path] Processing row ${index + 2}:`, row); // Uncomment for very verbose logging
          const result = await createOrUpdateBrand(row as BrandData);
          return { status: 'fulfilled', value: result, rowNum: index + 2 }; // Keep existing structure
        } catch (error) {
          console.error(`[Brands Path] Error processing row ${index + 2}:`, error);
          return { status: 'rejected', reason: error, rowNum: index + 2 }; // Keep existing structure
        }
      }));

      // Filter successful results
      // Filter successful results (already done)
      savedData = results.filter(r => r.status === 'fulfilled').map(r => (r as { status: 'fulfilled', value: Brand }).value); // Use Brand type
      failedCount = results.filter(r => r.status === 'rejected').length;

      console.log(`[Brands Path] Successfully saved ${savedData.length} brand rows.`);
      if (failedCount > 0) {
        console.warn(`[Brands Path] Failed to save ${failedCount} brand rows.`);
      }
    } else {
      return NextResponse.json({ error: "Неизвестный тип импорта" }, { status: 400 })
    }

    // Construct the response with detailed statistics
    return NextResponse.json({
      message: `Обработка завершена. Успешно: ${savedData.length}, Ошибки: ${failedCount}.`,
      totalRowsRead: data.length, // Total rows read from Excel (excluding header)
      rowsAttempted: rowsAttempted, // Rows passing initial validation
      rowsSucceeded: savedData.length,
      rowsFailed: failedCount,
      // data: savedData, // Consider removing or limiting this in production
      // headers: headers, // Debug info, maybe remove later
    });
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error)
    return NextResponse.json({
      error: "Произошла ошибка при обработке файла",
      details: (error as Error).message,
    }, { status: 500 })
  }
}

async function createOrUpdateZone(zoneData: ZoneData) {
  const status = getZoneStatus(zoneData["Статус"] || "");

  // Преобразуем цену в число или undefined (не null)
  let price: number | undefined = undefined;
  if (zoneData["Цена"] !== undefined && zoneData["Цена"] !== null) {
    // Если цена уже число, используем его, иначе преобразуем строку в число
    price = typeof zoneData["Цена"] === 'number'
      ? zoneData["Цена"]
      : parseFloat(zoneData["Цена"].toString());

    // Проверяем, что получилось валидное число
    if (isNaN(price)) {
      price = undefined;
    }
  }

  // Убедимся, что все обязательные поля имеют значения
  const uniqueIdentifier = zoneData["Уникальный идентификатор"] || "";
  if (!uniqueIdentifier) {
    throw new Error("Уникальный идентификатор обязателен");
  }

  // Создаем объект с данными для сохранения
  const zoneDataToSave = {
    city: zoneData["Город"] || "",
    number: zoneData["№"] || "",
    market: zoneData["Маркет"] || "",
    newFormat: zoneData["Формат маркета"] || "",
    equipment: zoneData["Оборудование"] || "",
    // Ensure dimensions is always a string
    dimensions: zoneData["Габариты"] !== undefined && zoneData["Габариты"] !== null ? String(zoneData["Габариты"]) : "",
    mainMacrozone: zoneData["Основная Макрозона"] || "",
    adjacentMacrozone: zoneData["Смежная макрозона"] || "",
    status: status,
    supplier: zoneData["Поставщик"] || null,
    brand: zoneData["Brand"] || null,
    category: zoneData["Категория товара"] || null,
    // Новые поля
    region: zoneData["Область"] || null,
    equipmentFormat: zoneData["Формат оборудования"] || null,
    price: price,
    externalId: zoneData["ID"] || null,
    sector: zoneData["Сектор"] || null,
    // Преобразуем КМ в строку, так как в схеме Prisma это поле определено как String?
    km: zoneData["КМ"] !== undefined && zoneData["КМ"] !== null
      ? String(zoneData["КМ"])
      : null,
    dmpNeighborhood: zoneData["Товарное соседство ДМП"] || null,
    purpose: zoneData["Назначение"] || null,
    subpurpose: zoneData["Подназначение"] || null,
  };

  try {
    // Теперь типы Prisma соответствуют нашей схеме
    return await prisma.zone.upsert({
      where: { uniqueIdentifier },
      update: zoneDataToSave,
      create: {
        uniqueIdentifier,
        ...zoneDataToSave
      },
    });
  } catch (error) {
    console.error("Ошибка при сохранении зоны:", error);
    console.error("Данные зоны:", { uniqueIdentifier, ...zoneDataToSave });
    throw error;
  }
}

async function createOrUpdateSupplier(innData: InnData) {
  const inn = innData["Налоговый номер"]?.toString() || "";
  const organizationName = innData["Поставщик"]?.toString() || "";

  if (!inn) {
    throw new Error("ИНН обязателен");
  }

  if (!organizationName) {
    throw new Error("Название поставщика обязательно");
  }

  try {
    // Проверяем, существует ли организация с таким ИНН
    const existingOrganization = await prisma.innOrganization.findUnique({
      where: { inn }
    });

    if (existingOrganization) {
      // Обновляем существующую организацию
      return await prisma.innOrganization.update({
        where: { id: existingOrganization.id },
        data: {
          name: organizationName
        }
      });
    } else {
      // Создаем новую организацию
      return await prisma.innOrganization.create({
        data: {
          inn,
          name: organizationName
        }
      });
    }
  } catch (error) {
    console.error("Ошибка при сохранении организации:", error);
    console.error("Данные организации:", { inn, organizationName });
    throw error;
  }
}

async function createOrUpdateBrand(brandData: BrandData) {
  const brandName = brandData["Название Бренда"]?.toString().trim();
  const supplierInnsString = brandData["ИНН Поставщика"]?.toString().trim() || "";

  if (!brandName) {
    throw new Error("Название бренда обязательно");
  }

  // Parse comma-separated INNs, trim whitespace, and filter out empty strings
  const supplierInns = supplierInnsString
    .split(',')
    .map(inn => inn.trim())
    .filter(inn => inn.length > 0);

  // Find supplier users based on the parsed INNs
  const suppliersToConnect = await prisma.user.findMany({
    where: {
      inn: {
        in: supplierInns,
      },
      role: 'SUPPLIER', // Ensure we only link to actual suppliers
    },
    select: {
      id: true, // Select only the ID for connecting
    },
  });

  if (supplierInns.length > 0 && suppliersToConnect.length !== supplierInns.length) {
    // Optional: Warn if some provided INNs didn't match existing suppliers
    // const foundInns = suppliersToConnect.map(u => u.id); // Removed unused variable
    // Need to re-fetch INNs if we want to show which ones were not found
    console.warn(`[Brand Upload] For brand "${brandName}", some supplier INNs were not found or did not correspond to a SUPPLIER user: ${supplierInns.join(', ')}. Found ${suppliersToConnect.length} valid suppliers.`);
  }

  const connectData = suppliersToConnect.map(supplier => ({ id: supplier.id }));

  try {
    // Upsert the brand
    return await prisma.brand.upsert({
      where: { name: brandName },
      update: {
        // Use 'set' to replace existing suppliers with the new list
        // Use 'connect' if you only want to add without removing existing ones (less common for bulk upload)
        suppliers: {
          set: connectData, // Replaces all existing connections for this brand
        },
      },
      create: {
        name: brandName,
        suppliers: {
          connect: connectData, // Connects the found suppliers on creation
        },
      },
    });
  } catch (error) {
    console.error(`Ошибка при сохранении бренда "${brandName}":`, error);
    console.error("Данные бренда:", { brandName, supplierInns, connectData });
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      console.error(`Brand name "${brandName}" might already exist.`);
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
