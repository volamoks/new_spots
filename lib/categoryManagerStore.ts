import { create } from "zustand"
import { zonesData } from "./mockData"

interface Zone {
  "Уникальный идентификатор": string
  ID: string
  Город: string
  Маркет: string
  Оборудование: string
  Brand: string
  Статус: string
  Поставщик: string
}

interface CategoryManagerState {
  selectedSupplier: string
  selectedZones: string[]
  suppliers: string[]
  supplierData: {
    brands: string[]
    locations: string[]
    totalSpots: number
    spotsPerLocation: { city: string; count: number }[]
    spotsPerBrand: { brand: string; count: number }[]
    zones: Zone[]
  } | null
  setSelectedSupplier: (supplier: string) => void
  toggleZoneSelection: (zoneId: string) => void
  clearSelectedZones: () => void
}

export const useCategoryManagerStore = create<CategoryManagerState>((set, get) => ({
  selectedSupplier: "",
  selectedZones: [],
  suppliers: [...new Set(zonesData.map((zone) => zone["Поставщик"]))].filter(
    (supplier) => supplier !== "КоммерческоеПустые" && supplier !== "Пустые",
  ),
  supplierData: null,
  setSelectedSupplier: (supplier) => {
    set({ selectedSupplier: supplier })
    const filteredZones = zonesData.filter((zone) => zone["Поставщик"] === supplier)
    const brands = [...new Set(filteredZones.map((zone) => zone["Brand"]))].filter(Boolean)
    const locations = [...new Set(filteredZones.map((zone) => zone["Город"]))].filter(Boolean)
    const totalSpots = filteredZones.length
    const spotsPerLocation = locations.map((location) => ({
      city: location,
      count: filteredZones.filter((zone) => zone["Город"] === location).length,
    }))
    const spotsPerBrand = brands.map((brand) => ({
      brand,
      count: filteredZones.filter((zone) => zone["Brand"] === brand).length,
    }))
    set({
      supplierData: {
        brands,
        locations,
        totalSpots,
        spotsPerLocation,
        spotsPerBrand,
        zones: filteredZones,
      },
    })
  },
  toggleZoneSelection: (zoneId) => {
    set((state) => ({
      selectedZones: state.selectedZones.includes(zoneId)
        ? state.selectedZones.filter((id) => id !== zoneId)
        : [...state.selectedZones, zoneId],
    }))
  },
  clearSelectedZones: () => set({ selectedZones: [] }),
}))

