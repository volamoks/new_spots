import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "DMP_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pendingKMs = await prisma.user.findMany({
      where: {
        role: "CATEGORY_MANAGER",
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        category: true,
        createdAt: true,
      },
    })

    return NextResponse.json(pendingKMs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

