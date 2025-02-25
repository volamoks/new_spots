"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ColumnSelector } from "./ColumnSelector";
import { Check, X } from "lucide-react";
import { BookingStatus } from "@prisma/client";

// Define the Booking type, including related Zone and Request information
export type Booking = {
  id: string;
  bookingRequestId: string;
  zoneId: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  zone: {
    id: string;
    city: string;
    number: string;
    market: string;
    newFormat: string;
    equipment: string;
    dimensions: string;
    mainMacrozone: string;
    adjacentMacrozone: string;
  };
  bookingRequest: {
    userId: string;
    status: string;
    category: string | null;
    createdAt: string;
    user: {
      name: string | null;
    };
  };
};

export type RequestsTableProps = {
  bookings: Booking[];
  requestId?: string;
  onApprove: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  role: "CATEGORY_MANAGER" | "DMP_MANAGER" | "SUPPLIER";
  onRequestStatusChange?: (requestId: string, newStatus: string) => void;
};

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
];

export function RequestsTable({
  bookings,
  requestId,
  onApprove,
  onReject,
  role,
  onRequestStatusChange,
}: RequestsTableProps) {
  const [expandedRequests, setExpandedRequests] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState(allColumns);

  const toggleExpand = (id: string) => {
    setExpandedRequests((prev) =>
      prev.includes(id)
        ? prev.filter((requestId) => requestId !== id)
        : [...prev, id]
    );
  };

  const handleColumnToggle = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  // Filter bookings by requestId if provided
  const filteredBookings = requestId
    ? bookings.filter((booking) => booking.bookingRequestId === requestId)
    : bookings;

  // Group bookings by request ID
  const groupedBookings: { [requestId: string]: Booking[] } = {};
  filteredBookings.forEach((booking) => {
    if (!groupedBookings[booking.bookingRequestId]) {
      groupedBookings[booking.bookingRequestId] = [];
    }
    groupedBookings[booking.bookingRequestId].push(booking);
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ColumnSelector
          columns={allColumns}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID заявки</TableHead>
            <TableHead>Поставщик</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Статус заявки</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedBookings).map(([reqId, requestBookings]) => {
            const request = requestBookings[0].bookingRequest;
            let calledRequestStatusChange = false; // Track if onRequestStatusChange has been called
            return (
              <>
                <TableRow
                  key={reqId}
                  className="cursor-pointer"
                  onClick={() => toggleExpand(reqId)}
                >
                  <TableCell>{reqId}</TableCell>
                  <TableCell>{request.user.name}</TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    {expandedRequests.includes(reqId)
                      ? "Скрыть детали"
                      : "Показать детали"}
                  </TableCell>
                </TableRow>
                {expandedRequests.includes(reqId) && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {visibleColumns.includes("ID") && (
                              <TableHead className="bg-gray-100 font-medium">
                                ID
                              </TableHead>
                            )}
                            {visibleColumns.includes("Город") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Город
                              </TableHead>
                            )}
                            {visibleColumns.includes("№") && (
                              <TableHead className="bg-gray-100 font-medium">
                                №
                              </TableHead>
                            )}
                            {visibleColumns.includes("Маркет") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Маркет
                              </TableHead>
                            )}
                            {visibleColumns.includes("Новый формат") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Новый формат
                              </TableHead>
                            )}
                            {visibleColumns.includes("Оборудование") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Оборудование
                              </TableHead>
                            )}
                            {visibleColumns.includes("Габариты") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Габариты
                              </TableHead>
                            )}
                            {visibleColumns.includes("Основная Макрозона") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Основная Макрозона
                              </TableHead>
                            )}
                            {visibleColumns.includes("Смежная макрозона") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Смежная макрозона
                              </TableHead>
                            )}
                            {visibleColumns.includes("Статус") && (
                              <TableHead className="bg-gray-100 font-medium">
                                Статус
                              </TableHead>
                            )}
                            {role !== "SUPPLIER" &&
                              visibleColumns.includes("Действия") && (
                                <TableHead className="bg-gray-100 font-medium">
                                  Действия
                                </TableHead>
                              )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requestBookings.map((booking) => {
                            // Check if all bookings in this request are reviewed
                            const allReviewed = requestBookings.every(
                              (b) =>
                                b.status === BookingStatus.KM_APPROVED ||
                                b.status === BookingStatus.KM_REJECTED
                            );

                            // Call onRequestStatusChange if all are reviewed and it hasn't been called yet
                            if (
                              allReviewed &&
                              onRequestStatusChange &&
                              !calledRequestStatusChange
                            ) {
                              onRequestStatusChange(reqId, "CLOSED");
                              calledRequestStatusChange = true; // Set to true after calling
                            }
                            return (
                              <TableRow key={booking.id}>
                                {visibleColumns.includes("ID") && (
                                  <TableCell>{booking.id}</TableCell>
                                )}
                                {visibleColumns.includes("Город") && (
                                  <TableCell>{booking.zone.city}</TableCell>
                                )}
                                {visibleColumns.includes("№") && (
                                  <TableCell>{booking.zone.number}</TableCell>
                                )}
                                {visibleColumns.includes("Маркет") && (
                                  <TableCell>{booking.zone.market}</TableCell>
                                )}
                                {visibleColumns.includes("Новый формат") && (
                                  <TableCell>
                                    {booking.zone.newFormat}
                                  </TableCell>
                                )}
                                {visibleColumns.includes("Оборудование") && (
                                  <TableCell>
                                    {booking.zone.equipment}
                                  </TableCell>
                                )}
                                {visibleColumns.includes("Габариты") && (
                                  <TableCell>
                                    {booking.zone.dimensions}
                                  </TableCell>
                                )}
                                {visibleColumns.includes("Основная Макрозона") && (
                                  <TableCell>
                                    {booking.zone.mainMacrozone}
                                  </TableCell>
                                )}
                                {visibleColumns.includes("Смежная макрозона") && (
                                  <TableCell>
                                    {booking.zone.adjacentMacrozone}
                                  </TableCell>
                                )}
                                {visibleColumns.includes("Статус") && (
                                  <TableCell>
                                    <StatusBadge status={booking.status} />
                                  </TableCell>
                                )}
                                {role !== "SUPPLIER" && visibleColumns.includes("Действия") && (
                                    <TableCell>
                                        {role === "CATEGORY_MANAGER" && booking.status === BookingStatus.PENDING_KM
                                            ? <div className="flex space-x-2">
                                                <Button onClick={(e) => { e.stopPropagation(); void onApprove(booking.id); }} size="sm" className="bg-green-500 hover:bg-green-600">
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button onClick={(e) => { e.stopPropagation(); void (onReject && onReject(booking.id)); }} size="sm" variant="destructive">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            : role === "DMP_MANAGER" && booking.status === BookingStatus.KM_APPROVED
                                                ? <div className="flex space-x-2">
                                                    <Button onClick={(e) => { e.stopPropagation(); void onApprove(booking.id); }} size="sm" className="bg-green-500 hover:bg-green-600">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={(e) => { e.stopPropagation(); void (onReject && onReject(booking.id)); }} size="sm" variant="destructive">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                : null
                                        }
                                    </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
