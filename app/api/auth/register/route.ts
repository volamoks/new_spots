import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Prisma } from "@prisma/client"; // Import Prisma namespace
import { prisma } from "@/lib/prisma";

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
  } catch (error) {
    console.error("Registration Error:", error); // Log the full error for debugging

    // Check for Prisma unique constraint violation (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      let field = 'Значение'; // Default field name
      // Prisma's error.meta.target is an array of strings indicating the fields involved
      const target = error.meta?.target as string[];
      if (target?.includes('email')) {
        field = 'Email';
      } else if (target?.includes('inn')) {
        field = 'ИНН';
      }
      return NextResponse.json(
        { error: `${field} уже используется.` },
        { status: 409 } // 409 Conflict
      );
    }

    // Log other types of errors for inspection
    if (error instanceof Error) {
      console.error("Non-Prisma Error:", error.message);
    } else {
      console.error("Unknown Error Type:", error);
    }

    // Generic error for other issues
    return NextResponse.json(
      { error: "Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз." },
      { status: 500 }
    );
  }
}
