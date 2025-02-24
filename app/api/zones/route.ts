import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const macrozone = searchParams.get("macrozone")
    const city = searchParams.get("city")

    const zones = await prisma.zone.findMany({
      where: {
        ...(category && { mainMacrozone: category }),
        ...(macrozone && { adjacentMacrozone: { contains: macrozone } }),
        ...(city && { city }),
        status: "AVAILABLE",
      },
    })

    return NextResponse.json(zones)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

