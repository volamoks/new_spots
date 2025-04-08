'use client';

import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';

// Renamed type and added role
type PendingUser = {
    id: string;
    name: string | null; // Allow null based on schema
    email: string | null; // Allow null based on schema
    category: string | null; // Allow null based on schema
    role: string; // Added role
    createdAt: string;
};

// Renamed component
export default function AccountApprovalPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]); // Renamed state
    // const router = useRouter()
    const { toast } = useToast();
    const { isAuthenticated, user } = useAuth(); // Remove argument

    // Renamed function
    const fetchPendingUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/dmp/pending-kms');
            // Using the updated API endpoint which now returns all pending users
            if (!response.ok) throw new Error('Failed to fetch pending users');
            const data = await response.json();
            setPendingUsers(data); // Update renamed state
        } catch (error: unknown) {
            // Log the error but don't show a toast, as per user request
            // The primary action's toast (approve/reject) is sufficient.
            console.error('Failed to fetch pending users after action:', error);
        }
    }, [toast]); // Removed fetchPendingKMs from deps as it's defined here

    useEffect(() => {
        if (isAuthenticated && user?.role === 'DMP_MANAGER') {
            fetchPendingUsers(); // Call renamed function
        }
    }, [isAuthenticated, user, fetchPendingUsers]); // Use renamed function in deps

    const handleApprove = async (userId: string) => {
        // Renamed parameter
        try {
            // Using the updated (or potentially renamed) API endpoint
            const response = await fetch(`/api/dmp/approve-km/${userId}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to approve user');
            toast({
                title: 'Успешно', // Generic success message
                description: 'Пользователь успешно подтвержден',
                variant: 'success',
            });
            fetchPendingUsers(); // Refresh the list using renamed function
        } catch (error: unknown) {
            console.error('Failed to approve user:', error); // Generic error log
            toast({
                title: 'Ошибка', // Generic error message
                description: 'Не удалось подтвердить пользователя',
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (userId: string) => {
        // Renamed parameter
        try {
            // Using the updated (or potentially renamed) API endpoint
            const response = await fetch(`/api/dmp/reject-km/${userId}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reject user');
            toast({
                title: 'Успешно', // Generic success message
                description: 'Пользователь успешно отклонен',
                variant: 'success',
            });
            fetchPendingUsers(); // Refresh the list using renamed function
        } catch (error: unknown) {
            console.error('Failed to reject user:', error); // Generic error log
            toast({
                title: 'Ошибка', // Generic error message
                description: 'Не удалось отклонить пользователя',
                variant: 'destructive',
            });
        }
    };

    if (!isAuthenticated || user?.role !== 'DMP_MANAGER') {
        return null; // Or a loading state
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Подтверждение регистрации аккаунтов
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Категория</TableHead>
                                    <TableHead>Роль</TableHead> {/* Added Role column */}
                                    <TableHead>Дата регистрации</TableHead>
                                    <TableHead>Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingUsers.map(
                                    (
                                        user, // Renamed map variable
                                    ) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            {/* Conditionally render category */}
                                            <TableCell>
                                                {user.role === 'CATEGORY_MANAGER'
                                                    ? user.category
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>{user.role}</TableCell> {/* Display Role */}
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    onClick={() => handleApprove(user.id)} // Use renamed parameter
                                                    className="mr-2"
                                                >
                                                    Подтвердить
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(user.id)} // Use renamed parameter
                                                    variant="destructive"
                                                >
                                                    Отклонить
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                            </TableBody>
                        </Table>
                        {pendingUsers.length === 0 && ( // Check renamed state
                            <p className="text-center py-4 text-muted-foreground">
                                Нет аккаунтов, ожидающих подтверждения // Generic empty state
                                message
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
