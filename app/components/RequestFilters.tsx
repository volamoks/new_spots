"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type RequestFilterState = {
  status: string
  supplierName: string
  dateFrom: string
  dateTo: string
}

type RequestFiltersProps = {
  onFilterChange: (filters: RequestFilterState) => void
}

export function RequestFilters({ onFilterChange }: RequestFiltersProps) {
  const [filters, setFilters] = useState<RequestFilterState>({
    status: "",
    supplierName: "",
    dateFrom: "",
    dateTo: "",
  })

  const handleFilterChange = (key: keyof RequestFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="NEW">Новая</SelectItem>
              <SelectItem value="CLOSED">Закрыта</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierName">Поставщик</Label>
          <Input
            id="supplierName"
            placeholder="Введите имя поставщика"
            value={filters.supplierName}
            onChange={(e) => handleFilterChange("supplierName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Дата с</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Дата по</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

