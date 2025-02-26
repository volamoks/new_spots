import { NextResponse } from "next/server"
import { testConnection, getDatabaseInfo } from "@/lib/db-test"

export async function GET() {
  try {
    const isConnected = await testConnection()
    const dbInfo = await getDatabaseInfo()

    if (isConnected) {
      return NextResponse.json({
        status: "ok",
        message: "Database connection successful",
        info: dbInfo
      })
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
