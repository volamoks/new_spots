'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useLoader } from '@/app/components/GlobalLoader';
import { useToast } from '@/components/ui/use-toast';
import { Zone, ZoneStatus } from '@prisma/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function DMPManagerZonesPage() {
    const { data: session } = useSession();
    const [zones, setZones] = useState<Zone[]>([]);
    const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cityFilters, setCityFilters] = useState<string[]>([]);
    const [marketFilters, setMarketFilters] = useState<string[]>([]);
    const [macrozoneFilters, setMacrozoneFilters] = useState<string[]>([]);
    const { withLoading } = useLoader();
    const { toast } = useToast();

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

    // Получение уникальных значений для фильтров
    const uniqueCities = React.useMemo(() => {
        return Array.from(new Set(zones.map(zone => zone.city))).sort();
    }, [zones]);

    const uniqueMarkets = React.useMemo(() => {
        return Array.from(new Set(zones.map(zone => zone.market))).sort();
    }, [zones]);

    const uniqueMacrozones = React.useMemo(() => {
        return Array.from(new Set(zones.map(zone => zone.mainMacrozone))).sort();
    }, [zones]);

    // Функция для переключения фильтра
    const toggleFilter = (type: 'city' | 'market' | 'macrozone', value: string) => {
        switch (type) {
            case 'city':
                setCityFilters(prev =>
                    prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev, value]
                );
                break;
            case 'market':
                setMarketFilters(prev =>
                    prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev, value]
                );
                break;
            case 'macrozone':
                setMacrozoneFilters(prev =>
                    prev.includes(value)
                        ? prev.filter(item => item !== value)
                        : [...prev, value]
                );
                break;
        }
    };

    // Фильтрация зон при изменении фильтров
    useEffect(() => {
        let result = [...zones];

        // Фильтрация по вкладкам (статус)
        if (activeTab !== 'all') {
            result = result.filter(zone => zone.status === activeTab);
        }

        // Фильтрация по городам
        if (cityFilters.length > 0) {
            result = result.filter(zone => cityFilters.includes(zone.city));
        }

        // Фильтрация по магазинам
        if (marketFilters.length > 0) {
            result = result.filter(zone => marketFilters.includes(zone.market));
        }

        // Фильтрация по макрозонам
        if (macrozoneFilters.length > 0) {
            result = result.filter(zone => macrozoneFilters.includes(zone.mainMacrozone));
        }

        // Фильтрация по поисковому запросу
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                zone =>
                    zone.uniqueIdentifier.toLowerCase().includes(term) ||
                    zone.city.toLowerCase().includes(term) ||
                    zone.market.toLowerCase().includes(term) ||
                    zone.mainMacrozone.toLowerCase().includes(term),
            );
        }

        setFilteredZones(result);
    }, [zones, activeTab, searchTerm, cityFilters, marketFilters, macrozoneFilters]);

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

            // Обновляем локальное состояние
            setZones(prevZones =>
                prevZones.map(zone => (zone.id === zoneId ? { ...zone, status: newStatus } : zone)),
            );

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
                                        onClick={() => setActiveTab('AVAILABLE')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === 'AVAILABLE'
                                                ? 'bg-green-200 text-green-800 shadow'
                                                : 'bg-green-100 text-green-600'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Доступные
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('BOOKED')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === 'BOOKED'
                                                ? 'bg-blue-200 text-blue-800 shadow'
                                                : 'bg-blue-100 text-blue-600'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        Забронированные
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('UNAVAILABLE')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            activeTab === 'UNAVAILABLE'
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
                                    <div className="w-full sm:w-auto">
                                        <button
                                            onClick={loadZones}
                                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
                                                                zone.status,
                                                            )}`}
                                                        >
                                                            {getStatusDisplay(zone.status)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col space-y-1">
                                                            <button
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        zone.id,
                                                                        'AVAILABLE',
                                                                    )
                                                                }
                                                                disabled={
                                                                    zone.status === 'AVAILABLE' ||
                                                                    isLoading
                                                                }
                                                                className={`text-xs px-2 py-1 rounded ${
                                                                    zone.status === 'AVAILABLE' ||
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
                                                                        'BOOKED',
                                                                    )
                                                                }
                                                                disabled={
                                                                    zone.status === 'BOOKED' ||
                                                                    isLoading
                                                                }
                                                                className={`text-xs px-2 py-1 rounded ${
                                                                    zone.status === 'BOOKED' ||
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
                                                                        'UNAVAILABLE',
                                                                    )
                                                                }
                                                                disabled={
                                                                    zone.status === 'UNAVAILABLE' ||
                                                                    isLoading
                                                                }
                                                                className={`text-xs px-2 py-1 rounded ${
                                                                    zone.status === 'UNAVAILABLE' ||
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
                            <div className="text-sm text-gray-500 mt-2">
                                Показано {filteredZones.length} из {zones.length} зон
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
