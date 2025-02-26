"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// Удалены неиспользуемые импорты Select компонентов
import { Input } from "@/components/ui/input"
import { Zone } from "@prisma/client"
import { ZoneStatus } from "@/types/zone"
import { useLoader } from "./GlobalLoader"
import { useToast } from "@/components/ui/use-toast"

interface ZonesManagementTableProps {
  zones: Zone[]
  onRefresh: () => void
}

export function ZonesManagementTable({ zones, onRefresh }: ZonesManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { withLoading } = useLoader()
  const { toast } = useToast()
  
  // Используем ref для отслеживания, идет ли обновление в данный момент
  const isUpdatingRef = useRef(false)
  // Ref для хранения текущих статусов зон
  const zoneStatusesRef = useRef<Record<string, ZoneStatus>>({})
  
  // Обновляем ref при монтировании компонента
  useEffect(() => {
    const updateZoneStatuses = () => {
      const newStatuses: Record<string, ZoneStatus> = {}
      zones.forEach(zone => {
        // Преобразуем статус из Prisma в наш тип ZoneStatus
        switch (zone.status) {
          case "AVAILABLE":
            newStatuses[zone.id] = ZoneStatus.AVAILABLE;
            break;
          case "BOOKED":
            newStatuses[zone.id] = ZoneStatus.BOOKED;
            break;
          case "UNAVAILABLE":
            newStatuses[zone.id] = ZoneStatus.UNAVAILABLE;
            break;
          default:
            newStatuses[zone.id] = ZoneStatus.UNAVAILABLE;
        }
      })
      zoneStatusesRef.current = newStatuses
    }
    
    // Инициализируем статусы при монтировании
    updateZoneStatuses()
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Зависим только от монтирования компонента

  // Локальное обновление зоны без перезагрузки всех данных
  const updateZoneLocally = (zoneId: string, newStatus: ZoneStatus) => {
    // Обновляем статус в ref
    zoneStatusesRef.current[zoneId] = newStatus
  }

  // Обработчик изменения статуса зоны
  const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
    // Проверяем, действительно ли статус изменился
    if (zoneStatusesRef.current[zoneId] === newStatus) {
      return // Статус не изменился, ничего не делаем
    }
    
    // Устанавливаем флаг, что идет обновление
    isUpdatingRef.current = true
    
    try {
      await withLoading(
        fetch(`/api/zones/${zoneId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to update zone status")
          }
          return response.json()
        }),
        "Обновление статуса зоны..."
      )

      toast({
        title: "Статус обновлен",
        description: `Статус зоны успешно изменен на ${newStatus}`,
        variant: "default",
      })

      // Обновляем локально вместо полной перезагрузки
      updateZoneLocally(zoneId, newStatus)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при обновлении статуса",
        variant: "destructive",
      })
    } finally {
      // Сбрасываем флаг обновления
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 100) // Небольшая задержка для завершения всех обновлений
    }
  }

  // Фильтрация зон по поисковому запросу и статусу
  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.uniqueIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.mainMacrozone.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || zone.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Преобразование статуса зоны для отображения
  const getStatusDisplay = (status: ZoneStatus) => {
    const statusMap: Record<ZoneStatus, string> = {
      [ZoneStatus.AVAILABLE]: "Доступна",
      [ZoneStatus.BOOKED]: "Забронирована",
      [ZoneStatus.UNAVAILABLE]: "Недоступна",
    }
    return statusMap[status] || status
  }

  // Получение класса статуса для стилизации
  const getStatusClass = (status: ZoneStatus) => {
    switch (status) {
      case ZoneStatus.AVAILABLE:
        return "bg-green-100 text-green-800 border-green-300"
      case ZoneStatus.BOOKED:
        return "bg-blue-100 text-blue-800 border-blue-300"
      case ZoneStatus.UNAVAILABLE:
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск по городу, магазину, макрозоне..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={onRefresh}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={isUpdatingRef.current}
          >
            Обновить данные
          </button>
        </div>
        <div className="w-full sm:w-48">
          <div className="border rounded-md p-2">
            <div className="text-sm text-gray-500 mb-2">Фильтр по статусу:</div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`text-xs px-2 py-1 rounded ${
                  statusFilter === "all"
                    ? "bg-gray-200 text-gray-800 font-bold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Все статусы
              </button>
              <button
                onClick={() => setStatusFilter(ZoneStatus.AVAILABLE)}
                className={`text-xs px-2 py-1 rounded ${
                  statusFilter === ZoneStatus.AVAILABLE
                    ? "bg-green-200 text-green-800 font-bold"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Доступна
              </button>
              <button
                onClick={() => setStatusFilter(ZoneStatus.BOOKED)}
                className={`text-xs px-2 py-1 rounded ${
                  statusFilter === ZoneStatus.BOOKED
                    ? "bg-blue-200 text-blue-800 font-bold"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                Забронирована
              </button>
              <button
                onClick={() => setStatusFilter(ZoneStatus.UNAVAILABLE)}
                className={`text-xs px-2 py-1 rounded ${
                  statusFilter === ZoneStatus.UNAVAILABLE
                    ? "bg-red-200 text-red-800 font-bold"
                    : "bg-red-100 text-red-600 hover:bg-red-200"
                }`}
              >
                Недоступна
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Город</TableHead>
              <TableHead>Магазин</TableHead>
              <TableHead>Макрозона</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length > 0 ? (
              filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.uniqueIdentifier}</TableCell>
                  <TableCell>{zone.city}</TableCell>
                  <TableCell>{zone.market}</TableCell>
                  <TableCell>{zone.mainMacrozone}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(
                        zone.status === "AVAILABLE" ? ZoneStatus.AVAILABLE :
                        zone.status === "BOOKED" ? ZoneStatus.BOOKED :
                        ZoneStatus.UNAVAILABLE
                      )}`}
                    >
                      {getStatusDisplay(
                        zone.status === "AVAILABLE" ? ZoneStatus.AVAILABLE :
                        zone.status === "BOOKED" ? ZoneStatus.BOOKED :
                        ZoneStatus.UNAVAILABLE
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleStatusChange(zone.id, ZoneStatus.AVAILABLE)}
                        disabled={zone.status === "AVAILABLE" || isUpdatingRef.current}
                        className={`text-xs px-2 py-1 rounded ${
                          zone.status === "AVAILABLE"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        Доступна
                      </button>
                      <button
                        onClick={() => handleStatusChange(zone.id, ZoneStatus.BOOKED)}
                        disabled={zone.status === "BOOKED" || isUpdatingRef.current}
                        className={`text-xs px-2 py-1 rounded ${
                          zone.status === "BOOKED"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        Забронирована
                      </button>
                      <button
                        onClick={() => handleStatusChange(zone.id, ZoneStatus.UNAVAILABLE)}
                        disabled={zone.status === "UNAVAILABLE" || isUpdatingRef.current}
                        className={`text-xs px-2 py-1 rounded ${
                          zone.status === "UNAVAILABLE"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        Недоступна
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  {zones.length === 0
                    ? "Зоны не найдены"
                    : "Нет зон, соответствующих фильтрам"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-gray-500">
        Показано {filteredZones.length} из {zones.length} зон
      </div>
    </div>
  )
}