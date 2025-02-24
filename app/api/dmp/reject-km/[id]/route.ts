import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "DMP_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status: "REJECTED" },
    })

    return NextResponse.json({ message: "Category Manager rejected successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

