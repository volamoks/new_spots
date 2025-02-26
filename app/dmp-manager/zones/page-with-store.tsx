'use client';

import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useLoader } from '@/app/components/GlobalLoader';
import { useToast } from '@/components/ui/use-toast';
import { ZoneStatus } from '@/types/zone';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useZonesStore } from '@/lib/zonesStore';

export default function DMPManagerZonesPage() {
    const { data: session } = useSession();
    const { withLoading } = useLoader();
    const { toast } = useToast();
    
    // Используем глобальный стор вместо локального состояния
    const {
        zones,
        filteredZones,
        activeTab,
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        currentPage,
        itemsPerPage,
        isLoading,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
        setZones,
        setActiveTab,
        setSearchTerm,
        toggleFilter,
        setCurrentPage,
        setItemsPerPage,
        setIsLoading,
        updateZoneStatus,
        resetFilters
    } = useZonesStore();

    // Функция для загрузки зон из API
    const loadZones = async () => {
        if (!session) return;
        setIsLoading(true);

        try {
            const result = await withLoading(
                fetch('/api/zones').then(res => {
                    if (!res.ok) throw new Error('Ошибка при загрузке зон');
                    return res.json();
                }),
                'Загрузка зон...',
            );

            setZones(result);
        } catch (error) {
            toast({
                title: 'Ошибка',
                description:
                    error instanceof Error ? error.message : 'Произошла ошибка при загрузке зон',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Загружаем зоны только при монтировании компонента
    useEffect(() => {
        // Добавляем проверку, чтобы предотвратить лишние запросы
        if (zones.length === 0) {
            loadZones();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Обработчик изменения статуса зоны
    const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
        // Находим зону в текущем состоянии
        const zoneToUpdate = zones.find(z => z.id === zoneId);
        if (!zoneToUpdate || zoneToUpdate.status === newStatus) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/zones/${zoneId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update zone status');
            }

            await response.json(); // Получаем ответ, но не используем его, так как обновляем состояние локально

            // Обновляем состояние в сторе
            updateZoneStatus(zoneId, newStatus);

            toast({
                title: 'Статус обновлен',
                description: `Статус зоны успешно изменен на ${newStatus}`,
                variant: 'default',
            });
        } catch (error) {
            toast({
                title: 'Ошибка',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Произошла ошибка при обновлении статуса',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Преобразование статуса зоны для отображения
    const getStatusDisplay = (status: ZoneStatus) => {
        const statusMap: Record<ZoneStatus, string> = {
            [ZoneStatus.AVAILABLE]: 'Доступна',
            [ZoneStatus.BOOKED]: 'Забронирована',
            [ZoneStatus.UNAVAILABLE]: 'Недоступна',
        };
        return statusMap[status] || status;
    };

    // Получение класса статуса для стилизации
    const getStatusClass = (status: ZoneStatus) => {
        switch (status) {
            case ZoneStatus.AVAILABLE:
                return 'bg-green-100 text-green-800 border-green-300';
            case ZoneStatus.BOOKED:
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case ZoneStatus.UNAVAILABLE:
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Управление зонами
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Просматривайте и изменяйте статусы зон в системе
                        </p>
                        <p className="text-gray-600 mt-2">
                            Всего зон в системе:{' '}
                            <span className="font-semibold">{zones.length}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Таблица зон</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {/* Фильтры и поиск */}
                            <div className="flex flex-col space-y-4 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === 'all'
                                                ? 'bg-background text-foreground shadow'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Все зоны
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(ZoneStatus.AVAILABLE)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === ZoneStatus.AVAILABLE
                                                ? 'bg-green-200 text-green-800 shadow'
                                                : 'bg-green-100 text-green-600'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Доступные
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(ZoneStatus.BOOKED)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === ZoneStatus.BOOKED
                                                ? 'bg-blue-200 text-blue-800 shadow'
                                                : 'bg-blue-100 text-blue-600'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Забронированные
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(ZoneStatus.UNAVAILABLE)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === ZoneStatus.UNAVAILABLE
                                                ? 'bg-red-200 text-red-800 shadow'
                                                : 'bg-red-100 text-red-600'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Недоступные
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Поиск по городу, магазину, макрозоне..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={resetFilters}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                                            disabled={isLoading}
                                        >
                                            Сбросить фильтры
                                        </button>
                                        <button
                                            onClick={loadZones}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            disabled={isLoading}
                                        >
                                            Обновить данные
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Дополнительные фильтры */}
                            <div className="space-y-4 mt-4 border p-4 rounded-md bg-gray-50 mb-4">
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Город</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueCities.map((city) => (
                                            <Button
                                                key={city}
                                                variant={cityFilters.includes(city) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleFilter('city', city)}
                                                disabled={isLoading}
                                            >
                                                {city}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Магазин</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueMarkets.map((market) => (
                                            <Button
                                                key={market}
                                                variant={marketFilters.includes(market) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleFilter('market', market)}
                                                disabled={isLoading}
                                            >
                                                {market}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Оборудование</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueEquipments.map((equipment) => (
                                            <Button
                                                key={equipment}
                                                variant={equipmentFilters.includes(equipment) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleFilter('equipment', equipment)}
                                                disabled={isLoading}
                                            >
                                                {equipment}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Макрозона</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueMacrozones.map((macrozone) => (
                                            <Button
                                                key={macrozone}
                                                variant={macrozoneFilters.includes(macrozone) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleFilter('macrozone', macrozone)}
                                                disabled={isLoading}
                                            >
                                                {macrozone}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Таблица зон */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Город</TableHead>
                                            <TableHead>Магазин</TableHead>
                                            <TableHead>Макрозона</TableHead>
                                            <TableHead>Оборудование</TableHead>
                                            <TableHead>Статус</TableHead>
                                            <TableHead>Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredZones.length > 0 ? (
                                            filteredZones
                                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                .map(zone => (
                                                    <TableRow key={zone.id}>
                                                        <TableCell className="font-medium">
                                                            {zone.uniqueIdentifier}
                                                        </TableCell>
                                                        <TableCell>{zone.city}</TableCell>
                                                        <TableCell>{zone.market}</TableCell>
                                                        <TableCell>{zone.mainMacrozone}</TableCell>
                                                        <TableCell>{zone.equipment || '-'}</TableCell>
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
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            zone.id,
                                                                            ZoneStatus.AVAILABLE,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        zone.status === "AVAILABLE" ||
                                                                        isLoading
                                                                    }
                                                                    className={`text-xs px-2 py-1 rounded ${
                                                                        zone.status === "AVAILABLE" ||
                                                                        isLoading
                                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    }`}
                                                                >
                                                                    Доступна
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            zone.id,
                                                                            ZoneStatus.BOOKED,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        zone.status === "BOOKED" ||
                                                                        isLoading
                                                                    }
                                                                    className={`text-xs px-2 py-1 rounded ${
                                                                        zone.status === "BOOKED" ||
                                                                        isLoading
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
                                                                    disabled={
                                                                        zone.status === "UNAVAILABLE" ||
                                                                        isLoading
                                                                    }
                                                                    className={`text-xs px-2 py-1 rounded ${
                                                                        zone.status === "UNAVAILABLE" ||
                                                                        isLoading
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
                                                    colSpan={7}
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
                            
                            {/* Пагинация и выбор количества элементов на странице */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                <div className="text-sm text-gray-500">
                                    Показано {Math.min(itemsPerPage, filteredZones.length)} из {filteredZones.length} зон (всего {zones.length})
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Элементов на странице:</span>
                                        <select 
                                            className="border rounded p-1 text-sm"
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                            disabled={isLoading}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                        >
                                            Назад
                                        </button>
                                        <span className="text-sm">
                                            Страница {currentPage} из {Math.max(1, Math.ceil(filteredZones.length / itemsPerPage))}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredZones.length / itemsPerPage)))}
                                            disabled={currentPage >= Math.ceil(filteredZones.length / itemsPerPage) || isLoading}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                        >
                                            Вперед
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}