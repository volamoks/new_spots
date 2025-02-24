import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password, role, category, inn } = await req.json()
    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        category,
        inn,
        status: role === "CATEGORY_MANAGER" ? "PENDING" : "ACTIVE",
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

