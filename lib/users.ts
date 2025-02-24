import type { Role } from "@prisma/client"

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role,
  category?: string,
  inn?: string,
) {
  // const hashedPassword = await hash(password, 10)
  // const userData: any = {
  //   name,
  //   email,
  //   password: hashedPassword,
  //   role
  // }

  // if (role === Role.CATEGORY_MANAGER && category) {
  //   userData.category = category
  // } else if (role === Role.SUPPLIER && inn) {
  //   userData.inn = inn
  // }

  // const user = await prisma.user.create({ data: userData })
  // return { id: user.id, name: user.name, email: user.email, role: user.role, category: user.category, inn: user.inn }

  // Temporary return mock user data
  return { id: "mock-user-id", name, email, role, category, inn }
}

export async function getUserByEmail(email: string) {
  // const user = await prisma.user.findUnique({
  //   where: { email }
  // })
  // return user

  // Temporary return null (user not found)
  return null
}

export async function getUserById(id: string) {
  // const user = await prisma.user.findUnique({
  //   where: { id }
  // })
  // return user

  // Temporary return mock user data
  return { id, name: "Mock User", email: "mock@example.com", role: "SUPPLIER" as Role }
}

