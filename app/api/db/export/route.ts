import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from 'exceljs';
import {
  exportBookingsToExcel, // Removed exportZonesToExcel, exportDatabaseToExcel
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
    // Type is now fixed to 'bookings', filename generation remains for potential future use or override
    const { searchParams } = new URL(req.url);
    // const type = "bookings"; // Removed unused variable
    const filename = searchParams.get("filename") || `export-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Only export bookings is supported now
    const buffer: ExcelJS.Buffer = await exportBookingsToExcel();

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
    console.error("Error exporting bookings:", error); // Updated error message context
    return NextResponse.json(
      { error: "Failed to export bookings" }, // Updated error message
      { status: 500 }
    );
  }
}