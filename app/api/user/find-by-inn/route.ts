import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(req: NextRequest) {
  try {
    const inn = req.nextUrl.searchParams.get("inn")

    if (!inn) {
      return NextResponse.json({ error: "ИНН не указан" }, { status: 400 })
    }

    const organization = await prisma.innOrganization.findUnique({
      where: { inn },
      select: {
        id: true,
        name: true
      }
    })

    if (!organization) {
      return NextResponse.json({ error: "Организация не найдена" }, { status: 404 })
    }

    return NextResponse.json({
      id: organization.id,
      name: organization.name
    })
  } catch (error) {
    console.error("Ошибка при поиске организации:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при поиске организации" },
      { status: 500 }
    )
  }
}
