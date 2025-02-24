import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

// Add connection handling
prisma
  .$connect()
  .then(() => {
    console.log("✅ Database connected successfully")
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  })

