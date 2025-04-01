import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from 'exceljs';
import {
  exportZonesToExcel,
  exportBookingsToExcel,
  exportDatabaseToExcel
} from "@/lib/utils/excel-export";

export const dynamic = 'force-dynamic'; // Force dynamic rendering


export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации - только DMP менеджер может экспортировать данные
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверка роли пользователя
    if (session.user.role !== "DMP_MANAGER") {
      return NextResponse.json(
        { error: "Only DMP managers can export database" },
        { status: 403 }
      );
    }

    // Получение параметра type из URL
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const filename = searchParams.get("filename") || `export-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Выбор функции экспорта в зависимости от типа
    let buffer: ExcelJS.Buffer;

    switch (type) {
      case "zones":
        buffer = await exportZonesToExcel();
        break;
      case "bookings":
        buffer = await exportBookingsToExcel();
        break;
      case "all":
      default:
        buffer = await exportDatabaseToExcel();
        break;
    }

    // Создание и возврат ответа с Excel-файлом
    const response = new NextResponse(buffer);

    // Установка заголовков для скачивания файла
    response.headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(filename)}`
    );

    return response;
  } catch (error) {
    console.error("Error exporting database:", error);
    return NextResponse.json(
      { error: "Failed to export database" },
      { status: 500 }
    );
  }
}