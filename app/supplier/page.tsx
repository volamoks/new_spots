'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import the new hook
// Removed Zone import if not used directly
// Removed Button import if not used
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed useToast if not used after removing handleSubmit

export default function SupplierPage() {
    const { data: session } = useSession(); // Get session
    const {
        zones,
        isLoading, // Use isLoading from store
        error, // Use error from store
        fetchZones, // Use fetchZones from store
    } = useRoleData('supplier'); // Use the hook for supplier role

    useEffect(() => {
        // Fetch zones when session is available
        if (session) {
            fetchZones(); // This will fetch zones filtered by supplier INN
        }
    }, [session, fetchZones]);

    // Removed handleZoneSelection and handleSubmit as suppliers likely don't create bookings here

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* <Navigation /> */}
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Панель поставщика
                        </CardTitle>
                        <CardDescription>
                            Просмотр доступных зон для поставщика. Создание заявок на бронирование.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-lg font-semibold mb-4">Ваши зоны:</h2>
                        {isLoading && <p>Загрузка зон...</p>}
                        {error && <p className="text-red-500">Ошибка загрузки зон: {error}</p>}
                        {!isLoading && !error && zones.length === 0 && <p>Нет доступных зон.</p>}
                        {!isLoading && !error && zones.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {zones.map(zone => (
                                    <Card key={zone.id}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-medium">
                                                {zone.city} - {zone.market} - {zone.number}
                                            </CardTitle>
                                            <CardDescription>
                                                Статус: {zone.status}{' '}
                                                {/* Display status or other relevant info */}
                                            </CardDescription>
                                        </CardHeader>
                                        {/* Add CardContent if more details are needed */}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
