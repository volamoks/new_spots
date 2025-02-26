import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/prisma"
import { ZoneStatus } from "@/types/zone"
import { authOptions } from "@/lib/auth"

// Обработчик PATCH-запроса для изменения статуса зоны
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка авторизации - только DMP менеджер может изменять статус зоны
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверка роли пользователя
    if (session.user.role !== "DMP_MANAGER") {
      return NextResponse.json(
        { error: "Only DMP managers can change zone status" },
        { status: 403 }
      )
    }

    // Получение ID зоны из параметров URL
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "Zone ID is required" }, { status: 400 })
    }

    // Получение данных из запроса
    const body = await request.json()
    const { status } = body

    // Валидация статуса
    if (!status || !Object.values(ZoneStatus).includes(status as ZoneStatus)) {
      return NextResponse.json(
        { error: "Invalid status value", validValues: Object.values(ZoneStatus) },
        { status: 400 }
      )
    }

    // Обновление статуса зоны в базе данных
    const updatedZone = await prisma.zone.update({
      where: { id },
      data: { status: status as ZoneStatus },
    })

    // Возвращаем обновленную зону
    return NextResponse.json(updatedZone)
  } catch (error) {
    console.error("Error updating zone status:", error)
    return NextResponse.json(
      { error: "Failed to update zone status" },
      { status: 500 }
    )
  }
}