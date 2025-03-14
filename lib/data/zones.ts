import { prisma } from "../prisma";
import { Zone } from "@prisma/client";

export async function getZonesByMacrozones(macrozones: string[]): Promise<Zone[]> {
  return prisma.zone.findMany({
    where: {
      mainMacrozone: {
        in: macrozones,
      },
    },
  });
}

export async function getAllZones(): Promise<Zone[]> {
  return prisma.zone.findMany({
    orderBy: [
      { city: 'asc' },
      { market: 'asc' }
    ],
  });
}
