import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testConnection() {
  try {
    // Test the connection
    await prisma.$connect()
    console.log("✅ Successfully connected to database")

    // Get the number of users (or any other table) to verify query execution
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in database`)

    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

export { testConnection }

