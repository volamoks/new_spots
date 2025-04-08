import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "DMP_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all users with PENDING status, regardless of role
    const pendingUsers = await prisma.user.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        category: true, // Keep category for CMs
        role: true,     // Add role to the selection
        createdAt: true,
      },
    })

    return NextResponse.json(pendingUsers)
  } catch (error) {
    let message = "An unknown error occurred";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
