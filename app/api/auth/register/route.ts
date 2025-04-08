import { NextResponse } from "next/server";
import { hash } from "bcrypt";
// Import Enums if they exist after generation, otherwise Prisma namespace is enough
// If 'Role' or 'UserStatus' cause errors after generation, remove them from the import.
import { Prisma, Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Helper function to map string to Role enum
// NOTE: If 'Role' is not available as a value after 'prisma generate',
// you might need to revert to using strings if the enum isn't exported correctly.
function mapStringToRole(roleString: string | undefined): Role {
  switch (roleString?.toUpperCase()) {
    case "CATEGORY_MANAGER": return Role.CATEGORY_MANAGER;
    case "DMP_MANAGER": return Role.DMP_MANAGER;
    case "SUPPLIER":
    default: return Role.SUPPLIER;
  }
}

// Helper function to map Role enum to UserStatus enum
// NOTE: Similar to Role, adjust if UserStatus isn't available as a value.
function mapRoleToStatus(role: Role): UserStatus {
  // Set status to PENDING for both CATEGORY_MANAGER and DMP_MANAGER
  return role === Role.CATEGORY_MANAGER || role === Role.DMP_MANAGER
    ? UserStatus.PENDING
    : UserStatus.ACTIVE;
}


export async function POST(req: Request) {
  try {
    const { name, email, password, role: roleString, category, inn } = await req.json();
    const hashedPassword = await hash(password, 10);

    // Map input strings to the corresponding Enums based on schema
    const userRole: Role = mapStringToRole(roleString);
    const userStatus: UserStatus = mapRoleToStatus(userRole);

    // This structure aligns with the provided schema.prisma
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,       // Use Role enum member
        category,             // Use category string directly
        inn,
        status: userStatus,   // Use UserStatus enum member
      },
      // Select the fields explicitly to help TS inference
      select: {
        id: true,
        name: true,
        email: true,
        role: true,           // Select the role enum field
        status: true,         // Select the status enum field
        // category: true,    // Optionally select category/inn if needed in response
        // inn: true,
      }
    });

    // The selected fields should be directly available on the user object
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,      // Access the selected role field
        status: user.status,  // Access the selected status field
      },
    });

  } catch (error) {
    console.error("Registration Error:", error); // Log the full error

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        let field = 'Значение';
        const target = error.meta?.target as string[];
        if (target?.includes('email')) field = 'Email';
        // Removed INN check as it's no longer unique
        return NextResponse.json({ error: `${field} уже используется.` }, { status: 409 });
      }
      // Add other specific Prisma error checks if needed
    }

    // Log other types of errors
    if (error instanceof Error) console.error("Non-Prisma Error:", error.message, error.stack);
    else console.error("Unknown Error Type:", error);

    return NextResponse.json(
      { error: "Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз." },
      { status: 500 }
    );
  }
}
