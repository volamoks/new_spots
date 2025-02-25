import { NextResponse } from "next/server";
import { fetchZones } from "@/lib/zones";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const macrozone = searchParams.get("macrozone");

  if (!macrozone) {
    return NextResponse.json([], {
      status: 400,
      statusText: "macrozone is required",
    });
  }

  const zones = await fetchZones(macrozone);

  return NextResponse.json(zones);
}
