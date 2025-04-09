import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone";
import { Role, Prisma } from "@prisma/client"; // Import Role, Prisma types, and Prisma namespace
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
    const startTime = Date.now();
    console.log(`[Upload Start] Received request at ${new Date(startTime).toISOString()}`);
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
        console.log(`[Auth Check] Passed. Time: ${Date.now() - startTime} ms`);

        // --- Form Data & File Reading ---
        const formData = await req.formData()
        const file = formData.get("file") as File
        const type = formData.get("type") as string || req.nextUrl.searchParams.get("type") || "zones"

        if (!file) {
            return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
        }

        // --- File Size Check (Vercel Hobby Limit ~4.5MB) ---
        const VERCEL_HOBBY_LIMIT = 4.5 * 1024 * 1024;
        console.log(`[File Check] Size: ${file.size} bytes`);
        if (file.size > VERCEL_HOBBY_LIMIT) {
            console.error(`[File Check] File size ${file.size} exceeds limit ${VERCEL_HOBBY_LIMIT}`);
            return NextResponse.json({ error: `Файл слишком большой (${(file.size / (1024 * 1024)).toFixed(2)} MB). Максимальный размер: 4.5 MB.` }, { status: 413 }); // 413 Payload Too Large
        }

        const buffer = await file.arrayBuffer()
        console.log(`[File Read] Read into buffer. Time: ${Date.now() - startTime} ms`);

        // --- Excel Parsing ---
        const workbook = XLSX.read(buffer, { type: "buffer", codepage: 65001, cellDates: true, raw: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const headers: { [key: string]: number } = {}
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1")
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: range.s.r, c: C })
            const cell = worksheet[address]
            if (cell && cell.v) {
                const headerName = cell.v.toString().replace(/["\n\r]/g, "").replace(/\s+/g, " ").trim()
                headers[headerName] = C
                cell.v = headerName
                cell.w = headerName
            }
        }
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
                    if (headerName === "Цена" && cell && typeof cell.v === 'string' && !isNaN(parseFloat(cell.v))) {
                        row[headerName] = parseFloat(cell.v);
                    } else {
                        row[headerName] = cell ? cell.v : null
                    }
                }
            }
            data.push(row)
        }
        console.log(`[Excel Parse] Parsed ${data.length} rows. Time: ${Date.now() - startTime} ms`);

        // --- Validation ---
        const validationErrors: string[] = []
        let dataToProcess = data;
        if (type === "zones") {
            const filteredData = data.filter(row => row["Поставщик"] && row["Brand"] && row["Категория товара"]);
            dataToProcess = filteredData;
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Уникальный идентификатор"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует уникальный идентификатор`)
                if (!row["Город"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует город`)
                if (!row["Маркет"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует маркет`)
                if (!row["Основная Макрозона"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует основная макрозона`)
            })
        } else if (type === "inn") {
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Поставщик"]) validationErrors.push(`Строка ${rowNum}: Отсутствует название поставщика`)
                if (!row["Налоговый номер"]) validationErrors.push(`Строка ${rowNum}: Отсутствует ИНН`)
            })
        } else if (type === "brands") {
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Название Бренда"]) validationErrors.push(`Строка ${rowNum}: Отсутствует Название Бренда`)
            })
        }
        if (validationErrors.length > 0) {
            return NextResponse.json({ error: "Ошибки валидации", details: validationErrors, firstRow: data[0] }, { status: 400 });
        }
        console.log(`[Validation] Passed. Time: ${Date.now() - startTime} ms`);

        // --- Batch Save Logic ---
        let savedCount = 0; // General count for upserted records (inn, brands)
        let updatedCount = 0; // Specific count for updated zones
        let createdCount = 0; // Specific count for created zones
        let failedCount = 0;
        const rowsAttempted = dataToProcess.length;
        const dbStartTime = Date.now();

        if (type === "zones") {
            // Use the new transaction-based function
            const result = await batchUpsertZonesWithTransaction(dataToProcess as ZoneData[]);
            createdCount = result.created;
            updatedCount = result.updated;
            failedCount = result.failed;
            console.log(`[Zones DB] Processed ${rowsAttempted} rows. Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${failedCount}. DB Time: ${Date.now() - dbStartTime} ms`);

        } else if (type === "inn") {
            const { upserted, failed } = await batchUpsertSuppliers(dataToProcess as InnData[]);
            savedCount = upserted;
            failedCount = failed;
            console.log(`[INN DB] Processed ${rowsAttempted} rows. Upserted: ${savedCount}, Failed: ${failedCount}. DB Time: ${Date.now() - dbStartTime} ms`);

        } else if (type === "brands") {
            const { upserted, failed } = await batchUpsertBrands(dataToProcess as BrandData[]);
            savedCount = upserted;
            failedCount = failed;
            console.log(`[Brands DB] Processed ${rowsAttempted} rows. Upserted: ${savedCount}, Failed: ${failedCount}. DB Time: ${Date.now() - dbStartTime} ms`);

        } else {
            return NextResponse.json({ error: "Неизвестный тип импорта" }, { status: 400 })
        }

        // --- Response ---
        const successCount = type === "zones" ? createdCount + updatedCount : savedCount;
        const totalTime = Date.now() - startTime;
        console.log(`[Upload End] Completed. Total time: ${totalTime} ms`);
        return NextResponse.json({
            message: `Обработка завершена. Успешно создано/обновлено: ${successCount}, Ошибки: ${failedCount}. Время: ${totalTime} ms`,
            totalRowsRead: data.length,
            rowsAttempted: rowsAttempted,
            rowsCreated: type === "zones" ? createdCount : undefined,
            rowsUpdated: type === "zones" ? updatedCount : undefined,
            rowsSucceeded: successCount,
            rowsFailed: failedCount,
        });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[Upload Error] Error after ${totalTime} ms:`, error);
        // Ensure a valid JSON response even on unexpected errors
        return NextResponse.json({
            error: "Произошла внутренняя ошибка сервера при обработке файла",
            details: error instanceof Error ? error.message : String(error),
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


// --- Batch Upsert Logic for Zones (Using Transaction) ---
async function batchUpsertZonesWithTransaction(zoneDataArray: ZoneData[]) {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0; // Count rows skipped due to missing ID *before* transaction

    // Pre-filter identifiers to potentially reduce findMany query size
    const validEntries = zoneDataArray
        .map(zoneData => ({
            uniqueIdentifier: zoneData["Уникальный идентификатор"],
            data: zoneData // Keep original data for formatting later
        }))
        .filter(entry => {
            if (!entry.uniqueIdentifier) {
                console.warn("[Zones Tx] Skipping row due to missing unique identifier:", entry.data);
                skippedCount++;
                return false;
            }
            return true;
        }) as { uniqueIdentifier: string; data: ZoneData }[]; // Type assertion after filter

    if (validEntries.length === 0) {
        console.warn("[Zones Tx] No valid entries with unique identifiers found.");
        return { created: 0, updated: 0, failed: zoneDataArray.length };
    }

    const uniqueIdentifiers = validEntries.map(entry => entry.uniqueIdentifier);

    try {
        const result = await prisma.$transaction(async (tx) => {
            let txCreated = 0;
            let txUpdated = 0;

            // 1. Find existing zones within the transaction
            const existingZones = await tx.zone.findMany({
                where: { uniqueIdentifier: { in: uniqueIdentifiers } },
                select: { uniqueIdentifier: true }, // Select only necessary field
            });
            const existingIds = new Set(existingZones.map(z => z.uniqueIdentifier));
            console.log(`[Zones Tx] Found ${existingIds.size} existing zones among ${uniqueIdentifiers.length} unique IDs.`);

            // 2. Iterate and perform create or update within the transaction
            for (const entry of validEntries) {
                const formattedData = formatZoneData(entry.data); // Format data here

                if (existingIds.has(entry.uniqueIdentifier)) {
                    // Update existing
                    try {
                        await tx.zone.update({
                            where: { uniqueIdentifier: entry.uniqueIdentifier },
                            data: formattedData,
                        });
                        txUpdated++;
                    } catch (updateError) {
                        console.error(`[Zones Tx] Failed to update zone ${entry.uniqueIdentifier}:`, updateError);
                        // Decide how to handle: throw to rollback all, or just log and continue?
                        // For bulk uploads, often better to log and continue if possible.
                        // Re-throwing will rollback the entire transaction.
                        throw updateError; // Rollback transaction on individual update failure
                    }
                } else {
                    // Create new
                    try {
                        await tx.zone.create({
                            data: {
                                uniqueIdentifier: entry.uniqueIdentifier,
                                ...formattedData
                            },
                        });
                        txCreated++;
                    } catch (createError) {
                        console.error(`[Zones Tx] Failed to create zone ${entry.uniqueIdentifier}:`, createError);
                        // Check for unique constraint violation specifically if needed
                        if (createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === 'P2002') {
                            console.warn(`[Zones Tx] Zone ${entry.uniqueIdentifier} might have been created concurrently or check failed.`);
                            // Decide if this should cause rollback or be treated as a specific failure type
                        }
                        throw createError; // Rollback transaction on individual create failure
                    }
                }
            }

            console.log(`[Zones Tx] Transaction summary: Created ${txCreated}, Updated ${txUpdated}`);
            return { created: txCreated, updated: txUpdated };

        }, {
            maxWait: 15000, // Allow longer wait time for transaction acquisition (default 2000ms)
            // timeout: 30000, // Removed: Prisma Accelerate has a hard limit of 15000ms for interactive transactions (P6005 error)
        });

        createdCount = result.created;
        updatedCount = result.updated;
        // Failed count = total attempted - successful (created + updated) - initially skipped
        const failedCount = zoneDataArray.length - createdCount - updatedCount - skippedCount;
        return { created: createdCount, updated: updatedCount, failed: failedCount };

    } catch (error) {
        console.error("[Zones Tx] Transaction failed:", error);
        // If transaction fails, all operations within it are rolled back.
        // All entries attempted within the transaction are considered failed.
        const failedCount = zoneDataArray.length - skippedCount; // All valid entries failed
        return { created: 0, updated: 0, failed: failedCount };
    }
}


// --- Batch Upsert Logic for Suppliers (INN) ---
async function batchUpsertSuppliers(innDataArray: InnData[]) {
    let upsertedCount = 0;
    let failedCount = 0;
    const upsertsToPerform: Prisma.InnOrganizationUpsertArgs[] = [];

    for (const innData of innDataArray) {
        const inn = innData["Налоговый номер"]?.toString() || "";
        const organizationName = innData["Поставщик"]?.toString() || "";

        if (!inn || !organizationName) {
            console.warn("[INN Batch] Skipping row due to missing INN or Name:", innData);
            failedCount++;
            continue;
        }

        upsertsToPerform.push({
            where: { inn },
            update: { name: organizationName },
            create: { inn, name: organizationName },
        });
    }

    if (upsertsToPerform.length > 0) {
        console.log(`[INN Batch] Attempting to upsert ${upsertsToPerform.length} suppliers.`);
        // Prisma doesn't have upsertMany, so we execute them in parallel
        const results = await Promise.allSettled(
            upsertsToPerform.map(args =>
                prisma.innOrganization.upsert(args).catch(err => {
                    console.error(`[INN Batch] Failed to upsert supplier INN ${args.where.inn}:`, err);
                    throw err; // Re-throw for Promise.allSettled
                })
            )
        );

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                upsertedCount++;
            }
            // Don't increment failedCount here, calculate at the end
        });
        console.log(`[INN Batch] Upserted ${upsertedCount} suppliers. Failures in this step: ${upsertsToPerform.length - upsertedCount}.`);
    }

    // Final failure count = initial skips + failures during DB operations
    failedCount = innDataArray.length - upsertedCount;

    return { upserted: upsertedCount, failed: failedCount };
}


// --- Batch Upsert Logic for Brands ---
async function batchUpsertBrands(brandDataArray: BrandData[]) {
    let upsertedCount = 0;
    let failedCount = 0;
    const upsertsToPerform: { args: Prisma.BrandUpsertArgs; brandName: string }[] = [];
    const brandSupplierLinks: { brandName: string; supplierInns: string[] }[] = [];

    // 1. Prepare data and collect all supplier INNs needed
    const allSupplierInns = new Set<string>();
    for (const brandData of brandDataArray) {
        const brandName = brandData["Название Бренда"]?.toString().trim();
        const supplierInnsString = brandData["ИНН Поставщика"]?.toString().trim() || "";

        if (!brandName) {
            console.warn("[Brands Batch] Skipping row due to missing Brand Name:", brandData);
            failedCount++;
            continue;
        }

        const supplierInns = supplierInnsString.split(',').map(inn => inn.trim()).filter(inn => inn.length > 0);
        brandSupplierLinks.push({ brandName, supplierInns });
        supplierInns.forEach(inn => allSupplierInns.add(inn));
    }

    // 2. Find all relevant supplier users in one go
    const supplierIdMap: Map<string, string> = new Map(); // Map INN to User ID
    if (allSupplierInns.size > 0) {
        try {
            const suppliers = await prisma.user.findMany({
                where: {
                    inn: { in: Array.from(allSupplierInns) },
                    role: 'SUPPLIER',
                },
                select: { id: true, inn: true },
            });
            suppliers.forEach(s => {
                if (s.inn) { // Should always have INN based on query
                    supplierIdMap.set(s.inn, s.id);
                }
            });
            console.log(`[Brands Batch] Found ${supplierIdMap.size} existing supplier users for linking.`);
        } catch (error) {
            console.error("[Brands Batch] Error fetching suppliers for linking:", error);
            // If we can't fetch suppliers, we can't link, treat all as failed? Or proceed without links?
            // Let's proceed without links but log the error. The upsert might still work for the brand name.
        }
    }

    // 3. Prepare upsert arguments
    for (const { brandName, supplierInns } of brandSupplierLinks) {
        const connectData = supplierInns
            .map(inn => supplierIdMap.get(inn)) // Get user ID from INN
            .filter((id): id is string => !!id) // Filter out INNs not found or not mapped
            .map(id => ({ id })); // Format for connect/set

        if (supplierInns.length > 0 && connectData.length !== supplierInns.length) {
            console.warn(`[Brands Batch] For brand "${brandName}", some supplier INNs were not found or did not correspond to a SUPPLIER user: ${supplierInns.join(', ')}. Found ${connectData.length} valid suppliers to link.`);
        }

        upsertsToPerform.push({
            args: {
                where: { name: brandName },
                update: { suppliers: { set: connectData } }, // Use set to replace
                create: { name: brandName, suppliers: { connect: connectData } },
            },
            brandName: brandName // Keep for logging
        });
    }


    // 4. Execute upserts in parallel
    if (upsertsToPerform.length > 0) {
        console.log(`[Brands Batch] Attempting to upsert ${upsertsToPerform.length} brands.`);
        const results = await Promise.allSettled(
            upsertsToPerform.map(item =>
                prisma.brand.upsert(item.args).catch(err => {
                    console.error(`[Brands Batch] Failed to upsert brand "${item.brandName}":`, err);
                    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                        console.error(`[Brands Batch] Brand name "${item.brandName}" likely already exists (unique constraint violation).`);
                    }
                    throw err; // Re-throw for Promise.allSettled
                })
            )
        );

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                upsertedCount++;
            }
            // Don't increment failedCount here, calculate at the end
        });
        console.log(`[Brands Batch] Upserted ${upsertedCount} brands. Failures in this step: ${upsertsToPerform.length - upsertedCount}.`);
    }

    // Final failure count = initial skips + failures during DB operations
    failedCount = brandDataArray.length - upsertedCount;

    return { upserted: upsertedCount, failed: failedCount };
}


// --- Get Zone Status ---
function getZoneStatus(status: string): ZoneStatus {
    switch (status?.toLowerCase()) {
        case "свободно": return ZoneStatus.AVAILABLE;
        case "забронировано": return ZoneStatus.BOOKED;
        default: return ZoneStatus.UNAVAILABLE;
    }
}

// Note: Removed old batchUpsertZones function
