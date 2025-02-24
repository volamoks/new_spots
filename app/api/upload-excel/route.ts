import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@prisma/client"

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
    const data: any[] = []
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row: any = {}
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
    return NextResponse.json(
      {
        error: "Произошла ошибка при обработке файла",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

async function createOrUpdateZone(zoneData: any) {
  const status = getZoneStatus(zoneData["Статус"])

  return await prisma.zone.upsert({
    where: { uniqueIdentifier: zoneData["Уникальный идентификатор"] },
    update: {
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
    },
    create: {
      uniqueIdentifier: zoneData["Уникальный идентификатор"],
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
    },
  })
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

