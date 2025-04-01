'use client';

import { useState, useEffect } from 'react';
import type { Session } from 'next-auth';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfileDisplayProps {
    user: Session['user'];
}

// Helper component to fetch and display organization name
function OrganizationNameDisplay({ inn }: { inn: string }) {
    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrganizationName = async () => {
            if (inn && inn.length >= 9) {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/inn/find?inn=${inn}`);
                    if (response.ok) {
                        const data = await response.json();
                        setOrganizationName(data.name);
                    } else {
                        const errorData = await response.json();
                        setError(errorData.error || 'Не удалось найти организацию');
                        setOrganizationName(null);
                    }
                } catch (err) {
                    console.error('Error fetching organization:', err);
                    setError('Ошибка при запросе названия организации');
                    setOrganizationName(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setOrganizationName(null);
                setError(null);
                setIsLoading(false);
            }
        };

        fetchOrganizationName();
    }, [inn]);

    return (
        <div className="text-sm text-muted-foreground">
            {isLoading && <span>Поиск организации...</span>}
            {error && <span className="text-red-500">{error}</span>}
            {!isLoading && !error && organizationName && (
                <span>
                    {/* <div>Название организации</div> */}
                    <div>
                        <strong>{organizationName}</strong>
                    </div>
                </span>
            )}
            {!isLoading && !error && !organizationName && inn && inn.length >= 9 && (
                <span>Организация не найдена</span>
            )}
        </div>
    );
}

export default function UserProfileDisplay({ user }: UserProfileDisplayProps) {
    if (!user) {
        return null; // Or some loading/error state
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    {user.image && (
                        <Image
                            src={user.image}
                            alt={user.name ?? 'User Avatar'}
                            width={64}
                            height={64}
                            className="rounded-full"
                        />
                    )}
                    <div>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            {user.name || 'Пользователь'}
                        </CardTitle>
                        <CardDescription>Просмотр информации профиля</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">ID</p> {/* Removed font-medium */}
                    <p className="text-sm text-gray-900">{user.id}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email</p> {/* Removed font-medium */}
                    <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">Роль</p> {/* Removed font-medium */}
                    <div className="text-sm text-gray-900">
                        {' '}
                        {/* Changed p to div */}
                        <Badge variant="outline">{user.role}</Badge>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">Статус</p> {/* Removed font-medium */}
                    <div className="text-sm text-gray-900">
                        {' '}
                        {/* Changed p to div */}
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {user.status}
                        </Badge>
                    </div>
                </div>
                {/* Show Category only for CATEGORY_MANAGER */}
                {user.role === 'CATEGORY_MANAGER' && user.category && (
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500">Категория</p>{' '}
                        {/* Removed font-medium */}
                        <p className="text-sm text-gray-900">{user.category}</p>
                    </div>
                )}
                {/* Show INN only for SUPPLIER */}
                {user.role === 'SUPPLIER' && user.inn && (
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500">ИНН</p> {/* Removed font-medium */}
                        <p className="text-sm text-gray-900">{user.inn}</p>
                        <OrganizationNameDisplay inn={user.inn} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
