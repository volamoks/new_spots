"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { ColumnSelector } from "./ColumnSelector"
import { Check, X } from "lucide-react"

export type Zone = {
  id: string
  city: string
  number: string
  market: string
  newFormat: string
  equipment: string
  dimensions: string
  mainMacrozone: string
  adjacentMacrozone: string
  status: "Новая" | "Согласована КМ" | "Согласована ДМП" | "Отклонена"
}

export type Request = {
  id: number
  supplierName: string
  dateCreated: string
  dateRange: string
  zones: Zone[]
}

type RequestsTableProps = {
  requests: Request[]
  onApprove: (requestId: number, zoneId: string) => void
  onReject?: (requestId: number, zoneId: string) => void
  role: "КМ" | "ДМП" | "Поставщик"
}

const allColumns = [
  "ID",
  "Город",
  "№",
  "Маркет",
  "Новый формат",
  "Оборудование",
  "Габариты",
  "Основная Макрозона",
  "Смежная макрозона",
  "Статус",
  "Действия",
]

export function RequestsTable({ requests, onApprove, onReject, role }: RequestsTableProps) {
  const [expandedRequests, setExpandedRequests] = useState<number[]>([])
  const [visibleColumns, setVisibleColumns] = useState(allColumns)

  const toggleExpand = (id: number) => {
    setExpandedRequests((prev) => (prev.includes(id) ? prev.filter((requestId) => requestId !== id) : [...prev, id]))
  }

  const handleColumnToggle = (column: string) => {
    setVisibleColumns((prev) => (prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ColumnSelector columns={allColumns} visibleColumns={visibleColumns} onColumnToggle={handleColumnToggle} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID заявки</TableHead>
            <TableHead>Поставщик</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Даты бронирования</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <>
              <TableRow key={request.id} className="cursor-pointer" onClick={() => toggleExpand(request.id)}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.supplierName}</TableCell>
                <TableCell>{request.dateCreated}</TableCell>
                <TableCell>{request.dateRange}</TableCell>
                <TableCell>{expandedRequests.includes(request.id) ? "Скрыть детали" : "Показать детали"}</TableCell>
              </TableRow>
              {expandedRequests.includes(request.id) && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {visibleColumns.includes("ID") && (
                            <TableHead className="bg-gray-100 font-medium">ID</TableHead>
                          )}
                          {visibleColumns.includes("Город") && (
                            <TableHead className="bg-gray-100 font-medium">Город</TableHead>
                          )}
                          {visibleColumns.includes("№") && <TableHead className="bg-gray-100 font-medium">№</TableHead>}
                          {visibleColumns.includes("Маркет") && (
                            <TableHead className="bg-gray-100 font-medium">Маркет</TableHead>
                          )}
                          {visibleColumns.includes("Новый формат") && (
                            <TableHead className="bg-gray-100 font-medium">Новый формат</TableHead>
                          )}
                          {visibleColumns.includes("Оборудование") && (
                            <TableHead className="bg-gray-100 font-medium">Оборудование</TableHead>
                          )}
                          {visibleColumns.includes("Габариты") && (
                            <TableHead className="bg-gray-100 font-medium">Габариты</TableHead>
                          )}
                          {visibleColumns.includes("Основная Макрозона") && (
                            <TableHead className="bg-gray-100 font-medium">Основная Макрозона</TableHead>
                          )}
                          {visibleColumns.includes("Смежная макрозона") && (
                            <TableHead className="bg-gray-100 font-medium">Смежная макрозона</TableHead>
                          )}
                          {visibleColumns.includes("Статус") && (
                            <TableHead className="bg-gray-100 font-medium">Статус</TableHead>
                          )}
                          {role !== "Поставщик" && visibleColumns.includes("Действия") && (
                            <TableHead className="bg-gray-100 font-medium">Действия</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {request.zones.map((zone) => (
                          <TableRow key={zone.id}>
                            {visibleColumns.includes("ID") && <TableCell>{zone.id}</TableCell>}
                            {visibleColumns.includes("Город") && <TableCell>{zone.city}</TableCell>}
                            {visibleColumns.includes("№") && <TableCell>{zone.number}</TableCell>}
                            {visibleColumns.includes("Маркет") && <TableCell>{zone.market}</TableCell>}
                            {visibleColumns.includes("Новый формат") && <TableCell>{zone.newFormat}</TableCell>}
                            {visibleColumns.includes("Оборудование") && <TableCell>{zone.equipment}</TableCell>}
                            {visibleColumns.includes("Габариты") && <TableCell>{zone.dimensions}</TableCell>}
                            {visibleColumns.includes("Основная Макрозона") && (
                              <TableCell>{zone.mainMacrozone}</TableCell>
                            )}
                            {visibleColumns.includes("Смежная макрозона") && (
                              <TableCell>{zone.adjacentMacrozone}</TableCell>
                            )}
                            {visibleColumns.includes("Статус") && (
                              <TableCell>
                                <StatusBadge status={zone.status} />
                              </TableCell>
                            )}
                            {role !== "Поставщик" && visibleColumns.includes("Действия") && (
                              <TableCell>
                                {((role === "КМ" && zone.status === "Новая") ||
                                  (role === "ДМП" && zone.status === "Согласована КМ")) && (
                                  <div className="flex space-x-2">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onApprove(request.id, zone.id)
                                      }}
                                      size="sm"
                                      className="bg-green-500 hover:bg-green-600"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onReject && onReject(request.id, zone.id)
                                      }}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

