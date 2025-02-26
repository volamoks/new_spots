'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Zone } from '@/types/zone';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from './GlobalLoader';
import { useToast } from '@/components/ui/use-toast';

interface SimpleZonesTableProps {
    zones: Zone[];
    onRefresh: () => void;
}

export function SimpleZonesTable({ zones, onRefresh }: SimpleZonesTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const { withLoading } = useLoader();
    const { toast } = useToast();

    // Обработчик изменения статуса зоны
    const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
        try {
            await withLoading(
                fetch(`/api/zones/${zoneId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }).then(async response => {
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to update zone status');
                    }
                    return response.json();
                }),
                'Обновление статуса зоны...',
            );

            toast({
                title: 'Статус обновлен',
                description: `Статус зоны успешно изменен на ${newStatus}`,
                variant: 'default',
            });

            // Обновляем данные после изменения
            onRefresh();
        } catch (error) {
            toast({
                title: 'Ошибка',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Произошла ошибка при обновлении статуса',
                variant: 'destructive',
            });
        }
    };

    // Фильтрация зон по поисковому запросу
    const filteredZones = zones.filter(zone => {
        return (
            zone.uniqueIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            zone.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
            zone.mainMacrozone.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Преобразование статуса зоны для отображения
    const getStatusDisplay = (status: ZoneStatus) => {
        const statusMap: Record<ZoneStatus, string> = {
            AVAILABLE: 'Доступна',
            BOOKED: 'Забронирована',
            UNAVAILABLE: 'Недоступна',
        };
        return statusMap[status] || status;
    };

    // Получение класса статуса для стилизации
    const getStatusClass = (status: ZoneStatus) => {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'BOOKED':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'UNAVAILABLE':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Поиск по городу, магазину, макрозоне..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <button
                        onClick={onRefresh}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Обновить данные
                    </button>
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
                            filteredZones.map(zone => (
                                <TableRow key={zone.id}>
                                    <TableCell className="font-medium">
                                        {zone.uniqueIdentifier}
                                    </TableCell>
                                    <TableCell>{zone.city}</TableCell>
                                    <TableCell>{zone.market}</TableCell>
                                    <TableCell>{zone.mainMacrozone}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(
                                                zone.status === 'AVAILABLE'
                                                    ? ZoneStatus.AVAILABLE
                                                    : zone.status === 'BOOKED'
                                                    ? ZoneStatus.BOOKED
                                                    : ZoneStatus.UNAVAILABLE,
                                            )}`}
                                        >
                                            {getStatusDisplay(
                                                zone.status === 'AVAILABLE'
                                                    ? ZoneStatus.AVAILABLE
                                                    : zone.status === 'BOOKED'
                                                    ? ZoneStatus.BOOKED
                                                    : ZoneStatus.UNAVAILABLE,
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(
                                                        zone.id,
                                                        ZoneStatus.AVAILABLE,
                                                    )
                                                }
                                                disabled={zone.status === ZoneStatus.AVAILABLE}
                                                className={`text-xs px-2 py-1 rounded ${
                                                    zone.status === ZoneStatus.AVAILABLE
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                }`}
                                            >
                                                Доступна
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(zone.id, ZoneStatus.BOOKED)
                                                }
                                                disabled={zone.status === ZoneStatus.BOOKED}
                                                className={`text-xs px-2 py-1 rounded ${
                                                    zone.status === ZoneStatus.BOOKED
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                }`}
                                            >
                                                Забронирована
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(
                                                        zone.id,
                                                        ZoneStatus.UNAVAILABLE,
                                                    )
                                                }
                                                disabled={zone.status === ZoneStatus.UNAVAILABLE}
                                                className={`text-xs px-2 py-1 rounded ${
                                                    zone.status === ZoneStatus.UNAVAILABLE
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
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
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-4 text-gray-500"
                                >
                                    {zones.length === 0
                                        ? 'Зоны не найдены'
                                        : 'Нет зон, соответствующих фильтрам'}
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
    );
}
