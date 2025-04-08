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

    await prisma.user.update({
      where: { id: params.id },
      data: { status: "ACTIVE" },
    })

    return NextResponse.json({ message: "User approved successfully" })
  } catch (error) {
    // Log the full error for better debugging on the server side
    console.error(`[API ERROR] Failed to approve KM (ID: ${params.id}):`, error);

    let message = "Failed to approve user due to an internal error.";
    // Provide a slightly more specific message if it's a known error type
    if (error instanceof Error) {
      // You could add checks here for specific Prisma errors if needed
      // e.g., if (error.code === 'P2025') { message = "User not found."; }
      message = `Failed to approve user: ${error.message}`;
    }
    // Return the error response
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
