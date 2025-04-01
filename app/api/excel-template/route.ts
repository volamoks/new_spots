import { NextRequest, NextResponse } from "next/server"
import { generateExcelTemplate, generateInnTemplate } from "@/lib/excel-template"

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") || "zones"

    let template
    let filename

    if (type === "inn") {
      template = generateInnTemplate()
      filename = "inn-template.xlsx"
    } else {
      template = generateExcelTemplate()
      filename = "zones-template.xlsx"
    }

    // Возвращаем файл как ответ
    return new NextResponse(template, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Ошибка при генерации шаблона:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при генерации шаблона" },
      { status: 500 }
    )
  }
}
