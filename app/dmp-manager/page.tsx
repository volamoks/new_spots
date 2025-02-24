"use client"

import { useState, useMemo } from "react"
import { RequestsTable, type Request } from "../components/RequestsTable"
import { RequestFilters, type RequestFilterState } from "../components/RequestFilters"
import Navigation from "../components/Navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Updated mock data for DMP manager with complete zone information
const initialRequests: Request[] = [
  {
    id: 3,
    supplierName: "ООО Молоко",
    dateCreated: "2025-06-05",
    dateRange: "2025-07-01 - 2025-07-15",
    zones: [
      {
        id: "4",
        city: "Москва",
        number: "004",
        market: "Магазин №4",
        newFormat: "Да",
        equipment: "Премиум",
        dimensions: "4x4",
        mainMacrozone: "Центр",
        adjacentMacrozone: "Юг",
        status: "Согласована КМ",
      },
      {
        id: "5",
        city: "Екатеринбург",
        number: "005",
        market: "Магазин №5",
        newFormat: "Нет",
        equipment: "Стандарт",
        dimensions: "3x5",
        mainMacrozone: "Урал",
        adjacentMacrozone: "Центр",
        status: "Согласована КМ",
      },
    ],
  },
  {
    id: 4,
    supplierName: "ЗАО Обувь",
    dateCreated: "2025-06-06",
    dateRange: "2025-07-10 - 2025-07-31",
    zones: [
      {
        id: "6",
        city: "Казань",
        number: "006",
        market: "Магазин №6",
        newFormat: "Да",
        equipment: "Премиум",
        dimensions: "5x5",
        mainMacrozone: "Поволжье",
        adjacentMacrozone: "Центр",
        status: "Согласована КМ",
      },
    ],
  },
]

export default function DMPManagerPage() {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [filteredRequests, setFilteredRequests] = useState<Request[]>(initialRequests)

  const handleApprove = (requestId: number, zoneId: string) => {
    const updatedRequests = requests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            zones: request.zones.map((zone) => (zone.id === zoneId ? { ...zone, status: "Согласована ДМП" } : zone)),
          }
        : request,
    )
    setRequests(updatedRequests)
    setFilteredRequests(updatedRequests)
  }

  const handleReject = (requestId: number, zoneId: string) => {
    const updatedRequests = requests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            zones: request.zones.map((zone) => (zone.id === zoneId ? { ...zone, status: "Отклонена" } : zone)),
          }
        : request,
    )
    setRequests(updatedRequests)
    setFilteredRequests(updatedRequests)
  }

  const handleFilterChange = (filters: RequestFilterState) => {
    let filtered = requests

    if (filters.status) {
      filtered = filtered.filter((request) => request.zones.some((zone) => zone.status === filters.status))
    }

    if (filters.supplierName) {
      filtered = filtered.filter((request) =>
        request.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase()),
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((request) => new Date(request.dateCreated) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter((request) => new Date(request.dateCreated) <= new Date(filters.dateTo))
    }

    setFilteredRequests(filtered)
  }

  const filteredSpotsCount = useMemo(() => {
    return filteredRequests.reduce((acc, request) => acc + request.zones.length, 0)
  }, [filteredRequests])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">Панель менеджера ДМП</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Управляйте заявками, согласованными категорийными менеджерами</p>
            <p className="text-gray-600 mt-2">
              Отфильтровано спотов: <span className="font-semibold">{filteredSpotsCount}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestFilters onFilterChange={handleFilterChange} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Заявки на рассмотрение</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsTable requests={filteredRequests} onApprove={handleApprove} onReject={handleReject} role="ДМП" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

