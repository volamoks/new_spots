import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone";
import { Prisma } from "@prisma/client";
// File content will be fetched using standard fetch() on the blob URL (storageIdentifier)

// Define interfaces (or import from shared types)
interface ExcelData { [key: string]: string | number | null | undefined; }
// Interface definitions (ensure these match or import from shared types)
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
interface InnData extends ExcelData {
    "Поставщик"?: string;
    "Налоговый номер"?: string;
}
interface BrandData extends ExcelData {
    "Название Бренда"?: string; // Brand Name
    "ИНН Поставщика"?: string; // Optional Supplier INN
}

// Define the expected payload structure for the job request
interface ExcelUploadJobPayload {
    storageIdentifier: string; // URL from Vercel Blob
    fileName: string;
    importType: string;
    userId: string;
}

// --- Main POST Handler for the Job ---
export async function POST(req: NextRequest) {
    const startTime = Date.now();
    console.log(`[Job Handler Start] Received job request at ${new Date(startTime).toISOString()}`);

    // --- Security Check (IMPORTANT!) ---
    // This endpoint should NOT be publicly accessible.
    // Implement a security check, e.g., check a secret header, verify internal call source, etc.
    // Example: const secret = req.headers.get('X-Internal-Secret');
    // if (secret !== process.env.INTERNAL_API_SECRET) {
    //     console.error("[Job Handler Auth] Forbidden: Invalid or missing secret.");
    //     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }
    console.log("[Job Handler Auth] Security check passed (placeholder).");

    let payload: ExcelUploadJobPayload;
    try {
        payload = await req.json();
        if (!payload.storageIdentifier || !payload.fileName || !payload.importType || !payload.userId) {
            throw new Error("Invalid job payload structure.");
        }
    } catch (error) {
        console.error("[Job Handler Error] Failed to parse request body:", error);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { storageIdentifier, fileName, importType, userId } = payload;
    console.log(`[Job Handler Start] Processing ${fileName} (Blob: ${storageIdentifier}) for type ${importType}, user ${userId}`);

    try {
        // --- Step 1: Retrieve file content from Vercel Blob ---
        console.log(`[Job Handler Storage] Attempting to retrieve file from ${storageIdentifier}`);

        // Optional: Check if blob exists and get metadata first using head()
        // const blobInfo = await head(storageIdentifier);
        // console.log(`[Job Handler Storage] Blob info:`, blobInfo);
        // if (!blobInfo?.size) {
        //     throw new Error(`Blob not found or empty at ${storageIdentifier}`);
        // }

        // Fetch the blob content using its URL (storageIdentifier)
        const blobResponse = await fetch(storageIdentifier);
        if (!blobResponse.ok) {
            throw new Error(`Failed to fetch blob from ${storageIdentifier}: ${blobResponse.statusText}`);
        }
        const fileBuffer = await blobResponse.arrayBuffer();

        if (!fileBuffer || fileBuffer.byteLength === 0) {
            throw new Error(`File buffer could not be retrieved or is empty for ${storageIdentifier}.`);
        }
        console.log(`[Job Handler File] Retrieved file buffer. Size: ${fileBuffer.byteLength}. Time: ${Date.now() - startTime} ms`);


        // --- Step 2: Excel Parsing ---
        const workbook = XLSX.read(fileBuffer, { type: "buffer", codepage: 65001, cellDates: true, raw: true });
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
        console.log(`[Job Handler Parse] Parsed ${data.length} rows. Time: ${Date.now() - startTime} ms`);


        // --- Step 3: Validation ---
        const validationErrors: string[] = []
        let dataToProcess = data;
        // Add full validation logic here (copied from previous worker file)
        if (importType === "zones") {
            const filteredData = data.filter(row => row["Поставщик"] && row["Brand"] && row["Категория товара"]);
            dataToProcess = filteredData;
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Уникальный идентификатор"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует уникальный идентификатор`)
                if (!row["Город"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует город`)
                if (!row["Маркет"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует маркет`)
                if (!row["Основная Макрозона"]) validationErrors.push(`Строка ${rowNum} (после фильтрации): Отсутствует основная макрозона`)
            })
        } else if (importType === "inn") {
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Поставщик"]) validationErrors.push(`Строка ${rowNum}: Отсутствует название поставщика`)
                if (!row["Налоговый номер"]) validationErrors.push(`Строка ${rowNum}: Отсутствует ИНН`)
            })
        } else if (importType === "brands") {
            dataToProcess.forEach((row, index) => {
                const rowNum = index + 2
                if (!row["Название Бренда"]) validationErrors.push(`Строка ${rowNum}: Отсутствует Название Бренда`)
            })
        }

        if (validationErrors.length > 0) {
            console.error(`[Job Handler Validation] Failed for ${fileName} (Blob: ${storageIdentifier}):`, validationErrors);
            // TODO: Update job status (e.g., in DB)
            return NextResponse.json({ status: 'validation_failed', errors: validationErrors }, { status: 400 }); // Return error details
        }
        console.log(`[Job Handler Validation] Passed. Time: ${Date.now() - startTime} ms`);


        // --- Step 4: Batch Save Logic ---
        let savedCount = 0, updatedCount = 0, createdCount = 0, failedCount = 0;
        const dbStartTime = Date.now();

        if (importType === "zones") {
            const result = await batchUpsertZonesOptimized(dataToProcess as ZoneData[]);
            createdCount = result.created; updatedCount = result.updated; failedCount = result.failed;
            console.log(`[Job Handler Zones DB] Processed. DB Time: ${Date.now() - dbStartTime} ms`);
        } else if (importType === "inn") {
            const result = await batchUpsertSuppliers(dataToProcess as InnData[]);
            savedCount = result.upserted; failedCount = result.failed;
            console.log(`[Job Handler INN DB] Processed. DB Time: ${Date.now() - dbStartTime} ms`);
        } else if (importType === "brands") {
            const result = await batchUpsertBrands(dataToProcess as BrandData[]);
            savedCount = result.upserted; failedCount = result.failed;
            console.log(`[Job Handler Brands DB] Processed. DB Time: ${Date.now() - dbStartTime} ms`);
        } else {
            console.error(`[Job Handler Error] Unknown import type: ${importType} for ${fileName} (Blob: ${storageIdentifier})`);
            // TODO: Update job status
            return NextResponse.json({ status: 'error', message: `Unknown import type: ${importType}` }, { status: 400 });
        }

        // --- Step 5: Log results / Update status ---
        const successCount = importType === "zones" ? createdCount + updatedCount : savedCount;
        const totalTime = Date.now() - startTime;
        const resultsSummary = {
            status: 'completed',
            successCount,
            failedCount,
            totalTime
        };
        console.log(`[Job Handler End] Completed ${fileName} (Blob: ${storageIdentifier}). Results:`, resultsSummary);
        // TODO: Update job status in DB, notify user, etc.

        // Return success response for the job handler itself
        return NextResponse.json(resultsSummary, { status: 200 });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[Job Handler Error] Failed processing ${fileName} (Blob: ${storageIdentifier}) after ${totalTime} ms:`, error);
        // TODO: Update job status to failed
        return NextResponse.json({
            status: 'error',
            message: "Internal server error during background processing.",
            errorDetails: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}


// --- Helper Functions (Copied from lib/worker/process-excel-upload.ts) ---

function formatZoneData(zoneData: ZoneData): Omit<Prisma.ZoneCreateInput, 'uniqueIdentifier'> {
    const status = getZoneStatus(zoneData["Статус"] || "");
    let price: number | undefined = undefined;
    if (zoneData["Цена"] !== undefined && zoneData["Цена"] !== null) {
        price = typeof zoneData["Цена"] === 'number' ? zoneData["Цена"] : parseFloat(String(zoneData["Цена"]));
        if (isNaN(price)) price = undefined;
    }
    // Add all fields from the interface
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
        subpurpose: zoneData["Подназначение"] || null
    };
}

async function batchUpsertZonesOptimized(zoneDataArray: ZoneData[]) {
    let createdCount = 0, updatedCount = 0, skippedCount = 0;
    const zonesToCreate: Prisma.ZoneCreateManyInput[] = [];
    const updatesToPerform: { where: Prisma.ZoneWhereUniqueInput; data: Prisma.ZoneUpdateInput }[] = [];
    const validEntries = zoneDataArray.map(zoneData => ({ uniqueIdentifier: zoneData["Уникальный идентификатор"], data: zoneData })).filter(entry => { if (!entry.uniqueIdentifier) { skippedCount++; return false; } return true; }) as { uniqueIdentifier: string; data: ZoneData }[];
    if (validEntries.length === 0) return { created: 0, updated: 0, failed: zoneDataArray.length };
    const uniqueIdentifiers = validEntries.map(entry => entry.uniqueIdentifier);
    try {
        const existingZones = await prisma.zone.findMany({ where: { uniqueIdentifier: { in: uniqueIdentifiers } }, select: { uniqueIdentifier: true } });
        const existingIds = new Set(existingZones.map(z => z.uniqueIdentifier));
        for (const entry of validEntries) { const formattedData = formatZoneData(entry.data); if (existingIds.has(entry.uniqueIdentifier)) { updatesToPerform.push({ where: { uniqueIdentifier: entry.uniqueIdentifier }, data: formattedData }); } else { zonesToCreate.push({ uniqueIdentifier: entry.uniqueIdentifier, ...formattedData }); } }
        await prisma.$transaction(async (tx) => { if (zonesToCreate.length > 0) { const createResult = await tx.zone.createMany({ data: zonesToCreate, skipDuplicates: true }); createdCount = createResult.count; } if (updatesToPerform.length > 0) { let updateSuccess = 0; for (const updateArgs of updatesToPerform) { await tx.zone.update(updateArgs); updateSuccess++; } updatedCount = updateSuccess; } }, { maxWait: 15000, timeout: 15000 });
        const failedCount = zoneDataArray.length - createdCount - updatedCount - skippedCount;
        return { created: createdCount, updated: updatedCount, failed: failedCount };
    } catch (error) { console.error("[Zones Optimized] Transaction failed:", error); const failedCount = zoneDataArray.length - skippedCount; return { created: 0, updated: 0, failed: failedCount }; }
}

async function batchUpsertSuppliers(innDataArray: InnData[]) {
    let upsertedCount = 0, failedCount = 0; const upsertsToPerform: Prisma.InnOrganizationUpsertArgs[] = [];
    for (const innData of innDataArray) { const inn = innData["Налоговый номер"]?.toString() || ""; const organizationName = innData["Поставщик"]?.toString() || ""; if (!inn || !organizationName) { failedCount++; continue; } upsertsToPerform.push({ where: { inn }, update: { name: organizationName }, create: { inn, name: organizationName } }); }
    if (upsertsToPerform.length > 0) { const results = await Promise.allSettled(upsertsToPerform.map(args => prisma.innOrganization.upsert(args).catch(err => { throw err; }))); results.forEach(result => { if (result.status === 'fulfilled') upsertedCount++; }); }
    failedCount = innDataArray.length - upsertedCount; return { upserted: upsertedCount, failed: failedCount };
}

async function batchUpsertBrands(brandDataArray: BrandData[]) {
    let upsertedCount = 0, failedCount = 0; const upsertsToPerform: { args: Prisma.BrandUpsertArgs; brandName: string }[] = []; const brandSupplierLinks: { brandName: string; supplierInns: string[] }[] = []; const allSupplierInns = new Set<string>();
    for (const brandData of brandDataArray) { const brandName = brandData["Название Бренда"]?.toString().trim(); const supplierInnsString = brandData["ИНН Поставщика"]?.toString().trim() || ""; if (!brandName) { failedCount++; continue; } const supplierInns = supplierInnsString.split(',').map(inn => inn.trim()).filter(inn => inn.length > 0); brandSupplierLinks.push({ brandName, supplierInns }); supplierInns.forEach(inn => allSupplierInns.add(inn)); }
    const supplierIdMap: Map<string, string> = new Map(); if (allSupplierInns.size > 0) { try { const suppliers = await prisma.user.findMany({ where: { inn: { in: Array.from(allSupplierInns) }, role: 'SUPPLIER' }, select: { id: true, inn: true } }); suppliers.forEach(s => { if (s.inn) supplierIdMap.set(s.inn, s.id); }); } catch (error) { console.error("[Brands Batch] Error fetching suppliers:", error); } }
    for (const { brandName, supplierInns } of brandSupplierLinks) { const connectData = supplierInns.map(inn => supplierIdMap.get(inn)).filter((id): id is string => !!id).map(id => ({ id })); if (supplierInns.length > 0 && connectData.length !== supplierInns.length) console.warn(`[Brands Batch] Some INNs not found for brand "${brandName}"`); upsertsToPerform.push({ args: { where: { name: brandName }, update: { suppliers: { set: connectData } }, create: { name: brandName, suppliers: { connect: connectData } } }, brandName: brandName }); }
    if (upsertsToPerform.length > 0) { const results = await Promise.allSettled(upsertsToPerform.map(item => prisma.brand.upsert(item.args).catch(err => { throw err; }))); results.forEach(result => { if (result.status === 'fulfilled') upsertedCount++; }); }
    failedCount = brandDataArray.length - upsertedCount; return { upserted: upsertedCount, failed: failedCount };
}

function getZoneStatus(status: string): ZoneStatus {
    switch (status?.toLowerCase()) { case "свободно": return ZoneStatus.AVAILABLE; case "забронировано": return ZoneStatus.BOOKED; default: return ZoneStatus.UNAVAILABLE; }
}

// Removed duplicate interface definitions from the end