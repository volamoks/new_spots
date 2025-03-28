import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone"
import { } from "@prisma/client" // Removed unused Role, UserStatus

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

export async function POST(req: NextRequest) {
  try {
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
    let savedData
    if (type === "zones") {
      savedData = await Promise.all(dataToProcess.map(row => createOrUpdateZone(row as ZoneData)))
    } else if (type === "inn") {
      // For 'inn', dataToProcess is the original 'data'
      savedData = await Promise.all(dataToProcess.map(row => createOrUpdateSupplier(row as InnData)))
    } else {
      return NextResponse.json({ error: "Неизвестный тип импорта" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Данные успешно обработаны и сохранены",
      count: savedData.length,
      data: savedData,
      headers: headers, // Debug: Include headers in success response
    })
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
    dimensions: zoneData["Габариты"] || "",
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
