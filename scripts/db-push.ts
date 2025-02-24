import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"

async function main() {
  console.log("🚀 Starting database setup...")

  try {
    // Test database connection
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log("✅ Database connection successful")

    // Run prisma db push
    console.log("📤 Pushing schema to database...")
    execSync("npx prisma db push", { stdio: "inherit" })
    console.log("✅ Schema push completed")

    // Generate Prisma Client
    console.log("🔄 Generating Prisma Client...")
    execSync("npx prisma generate", { stdio: "inherit" })
    console.log("✅ Prisma Client generated")
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

main()

