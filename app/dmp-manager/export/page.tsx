'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataExportCard } from '@/app/components/DataExportCard';
import { DataImportCard } from '@/app/components/DataImportCard';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DMPManagerExportPage() {
    const { data: session, status } = useSession();

    // Перенаправляем неавторизованных пользователей или пользователей с неправильной ролью
    if (status === 'unauthenticated') {
        redirect('/login');
    }

    // Проверка роли после загрузки сессии
    if (session && session.user.role !== 'DMP_MANAGER') {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Экспорт и импорт данных
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            На этой странице вы можете экспортировать данные из системы в формате
                            Excel или импортировать новые данные.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DataExportCard />
                    <DataImportCard />
                </div>
            </main>
        </div>
    );
}
