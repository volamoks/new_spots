"use client"

import { useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdditionalFilters from "./AdditionalFilters"
import { getCategories, getAdjacentMacrozones } from "@/lib/filterData"
import { useGlobalStore } from "@/lib/store"

export default function Filters() {
  const { filters, setFilters, step, setStep, fetchZonesFromDB, isZonesLoading } = useGlobalStore();

  const categories = useMemo(() => getCategories(), []);
  const adjacentMacrozones = useMemo(() => {
    return filters.category ? getAdjacentMacrozones(filters.category) : [];
  }, [filters.category]);

  useEffect(() => {
    if (filters.macrozone && step >= 2) {
      fetchZonesFromDB();
    }
  }, [filters.macrozone, step, fetchZonesFromDB]);

 const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (key === "category") {
      newFilters.macrozone = "";
      setStep(2)
    }
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="p-6 bg-muted rounded-lg">
        {step >= 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Шаг 1: Выберите категорию товаров</h3>
            <Select onValueChange={(value) => handleFilterChange("category", value)} value={filters.category}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step >= 2 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Шаг 2: Выберите макрозону</h3>
            <Select onValueChange={(value) => handleFilterChange("macrozone", value)} value={filters.macrozone}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Выберите макрозону" />
              </SelectTrigger>
              <SelectContent>
                {adjacentMacrozones.map((macrozone) => (
                  <SelectItem key={macrozone} value={macrozone}>
                    {macrozone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step >= 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Дополнительные фильтры</h3>
            <AdditionalFilters />
          </div>
        )}
      </div>
    </div>
  )
}

