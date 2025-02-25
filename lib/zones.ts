import { prisma } from "./prisma";

export const fetchZones = async (macrozone: string) => {
  try {
    const zones = await prisma.zone.findMany({
      where: {
        mainMacrozone: macrozone,
      },
    });
    return zones;
  } catch (error) {
    console.error("Error fetching zones:", error);
    return [];
  }
};
