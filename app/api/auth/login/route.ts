import { NextResponse } from "next/server"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { sign } from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

