"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { zonesData } from "@/lib/zonesData"
import { useGlobalStore } from "@/lib/store"

export default function AdditionalFilters() {
  const { filters, setFilters } = useGlobalStore()

  const cities = useMemo(() => [...new Set(zonesData.map((zone) => zone["Город"]))], [])
  const storeCategories = useMemo(() => [...new Set(zonesData.map((zone) => zone["Формат маркета"]))], [])
  const equipmentTypes = useMemo(() => [...new Set(zonesData.map((zone) => zone["Оборудование"]))], [])

  const toggleFilter = (key: "cities" | "storeCategories" | "equipment", value: string) => {
    const currentFilters = filters[key]
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((item) => item !== value)
      : [...currentFilters, value]
    setFilters({ ...filters, [key]: newFilters })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Город</h3>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <Button
              key={city}
              variant={filters.cities.includes(city) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("cities", city)}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Категория магазина</h3>
        <div className="flex flex-wrap gap-2">
          {storeCategories.map((category) => (
            <Button
              key={category}
              variant={filters.storeCategories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("storeCategories", category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Оборудование</h3>
        <div className="flex flex-wrap gap-2">
          {equipmentTypes.map((equipment) => (
            <Button
              key={equipment}
              variant={filters.equipment.includes(equipment) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("equipment", equipment)}
            >
              {equipment}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

