"use client"

import { useState } from "react"
import { RequestsTable, type Request } from "../components/RequestsTable"
import Navigation from "../components/Navigation"

// Моковые данные для заявок поставщика
const initialRequests: Request[] = [
  {
    id: 1,
    supplierName: "ООО Фрукты",
    dateCreated: "2025-06-01",
    dateRange: "2025-06-10 - 2025-06-20",
    zones: [
      {
        id: "1",
        city: "Москва",
        number: "001",
        market: "Магазин №1",
        newFormat: "Да",
        equipment: "Стандарт",
        dimensions: "3x4",
        mainMacrozone: "Центр",
        adjacentMacrozone: "Север",
        status: "Согласована КМ",
      },
      {
        id: "2",
        city: "Санкт-Петербург",
        number: "002",
        market: "Магазин №2",
        newFormat: "Нет",
        equipment: "Премиум",
        dimensions: "4x5",
        mainMacrozone: "Север",
        adjacentMacrozone: "Центр",
        status: "Отклонена",
      },
    ],
  },
  {
    id: 2,
    supplierName: "ООО Фрукты",
    dateCreated: "2025-06-02",
    dateRange: "2025-06-15 - 2025-06-30",
    zones: [
      {
        id: "3",
        city: "Новосибирск",
        number: "003",
        market: "Магазин №3",
        newFormat: "Да",
        equipment: "Стандарт",
        dimensions: "3x3",
        mainMacrozone: "Восток",
        adjacentMacrozone: "Центр",
        status: "Новая",
      },
    ],
  },
]

export default function SupplierPage() {
  const [requests, setRequests] = useState<Request[]>(initialRequests)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Мои заявки</h1>
        <RequestsTable requests={requests} onApprove={() => {}} onReject={() => {}} role="Поставщик" />
      </main>
    </div>
  )
}

