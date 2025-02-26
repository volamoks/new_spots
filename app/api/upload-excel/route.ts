import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone"

interface ZoneData {
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
  [key: string]: string | number | null | undefined; // For other columns
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

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
    const data: ZoneData[] = []
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row: ZoneData = {}
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

    // Validate data
    const validationErrors: string[] = []

    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 because Excel starts from 1 and we have header row

      if (!row["Уникальный идентификатор"]) {
        validationErrors.push(`Строка ${rowNum}: Отсутствует уникальный идентификатор`)
      }
      if (!row["Город"]) {
        validationErrors.push(`Строка ${rowNum}: Отсутствует город`)
      }
      if (!row["Маркет"]) {
        validationErrors.push(`Строка ${rowNum}: Отсутствует маркет`)
      }
      if (!row["Основная Макрозона"]) {
        validationErrors.push(`Строка ${rowNum}: Отсутствует основная макрозона`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Ошибки валидации",
          details: validationErrors,
          firstRow: data[0], // Debug: Include first row in error response
        },
        { status: 400 },
      )
    }

    // Save data to database
    const savedData = await Promise.all(data.map(createOrUpdateZone))

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
  
  // Логируем типы данных для отладки
  console.log("Типы данных полей:", {
    price: typeof price,
    km: typeof zoneData["КМ"],
    цена: typeof zoneData["Цена"]
  });

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
