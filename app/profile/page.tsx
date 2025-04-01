'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Control, useWatch } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import UserProfileDisplay from '@/app/components/profile/UserProfileDisplay'; // Corrected import path

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Имя пользователя должно содержать не менее 2 символов',
    }),
    email: z.string().email({
        message: 'Пожалуйста, введите корректный email',
    }),
    category: z.string().optional(),
    inn: z.string().optional(),
});

// Custom component for INN field with organization name lookup (remains unchanged)
function InnField({ control }: { control: Control<z.infer<typeof formSchema>> }) {
    const inn = useWatch({
        control,
        name: 'inn',
    });

    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchOrganizationName = async () => {
            // Reset state if INN is too short or empty
            if (!inn || inn.length < 9) {
                setOrganizationName(null);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/inn/find?inn=${inn}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrganizationName(data.name);
                } else {
                    setOrganizationName(null); // Clear name if not found or error
                }
            } catch (error) {
                console.error('Error fetching organization:', error);
                setOrganizationName(null);
            } finally {
                setIsSearching(false);
            }
        };

        // Debounce or delay the fetch slightly if needed, otherwise fetch directly
        const timerId = setTimeout(() => {
            fetchOrganizationName();
        }, 300); // Optional: add a small delay

        return () => clearTimeout(timerId); // Cleanup timeout on unmount or inn change
    }, [inn]);

    return (
        <FormField
            control={control}
            name="inn"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>ИНН</FormLabel>
                    <FormControl>
                        <Input
                            {...field}
                            placeholder="Введите ИНН (10 или 12 цифр)"
                        />
                    </FormControl>
                    {/* Removed extra FormControl wrapper */}
                    {isSearching && <FormDescription>Поиск организации...</FormDescription>}
                    {!isSearching && organizationName && (
                        <FormDescription>
                            Название организации
                            <strong>{organizationName}</strong>
                        </FormDescription>
                    )}
                    {!isSearching && inn && inn.length >= 9 && !organizationName && (
                        <FormDescription className="text-orange-600">
                            Организация не найдена по ИНН.
                        </FormDescription>
                    )}
                    <FormMessage />
                    {/* Removed corresponding closing tag */}
                </FormItem>
            )}
        />
    );
}

export default function ProfilePage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            category: '',
            inn: '',
        },
    });

    // Effect to reset form when session data is available or changes
    useEffect(() => {
        if (session?.user) {
            form.reset({
                name: session.user.name || '',
                email: session.user.email || '',
                category: session.user.category || '',
                inn: session.user.inn || '',
            });
        }
    }, [session, form]); // Keep dependencies

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            const updatedUser = await response.json();
            // Trigger session update
            await update({
                ...session,
                user: {
                    ...session?.user,
                    ...updatedUser, // Merge updated fields
                },
            });

            toast({
                title: 'Профиль обновлен',
                description: 'Ваши данные успешно обновлены.',
                variant: 'success', // Ensure this variant exists or use 'default'
            });
            setIsEditing(false); // Switch back to view mode after successful update
        } catch (error) {
            // Use unknown or leave untyped for default unknown
            console.error('Profile update error:', error); // Log the error object
            // Determine the error message
            let errorMessage = 'Не удалось обновить профиль. Попробуйте позже.';
            if (error instanceof Error) {
                errorMessage = error.message; // Use message from Error object
            } else if (typeof error === 'string') {
                errorMessage = error; // Use the string directly if it's just a string error
            }

            toast({
                title: 'Ошибка обновления',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Handle loading state for session
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">Загрузка сессии...</div>
        ); // More specific message
    }

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        console.log('User unauthenticated, redirecting to login.'); // Add log
        router.push('/login');
        return null; // Render nothing while redirecting
    }

    // If authenticated, but session/user data is missing (should be rare, but handle defensively)
    if (status === 'authenticated' && (!session || !session.user)) {
        console.error('Authenticated but session or user data is missing. Session:', session); // Log the state
        // Redirecting to login as before, but logging helps diagnose
        router.push('/login');
        return null;
    }
    if (!session) {
        return;
    }
    // If we reach here, status is 'authenticated' and session.user exists.
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Optional: Add Navigation component back if needed */}
            {/* <Navigation /> */}
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card>
                    {' '}
                    {/* Removed max-w-2xl and mx-auto */}
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Профиль пользователя
                        </CardTitle>
                        <CardDescription>
                            {isEditing
                                ? 'Редактирование личной информации'
                                : 'Просмотр личной информации'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            // EDITING MODE: Show the form
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6" // Increased spacing slightly
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Имя пользователя</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        readOnly // Email usually shouldn't be changed by user
                                                        className="bg-gray-100"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Email нельзя изменить.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {session.user.role === 'CATEGORY_MANAGER' && (
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Категория</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Введите категорию"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    {session.user.role === 'SUPPLIER' && (
                                        <InnField control={form.control} />
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 pt-4">
                                        {' '}
                                        {/* Button wrapper */}
                                        <Button
                                            type="submit"
                                            className="w-full sm:w-auto flex-1"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Обновление...' : 'Сохранить изменения'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full sm:w-auto flex-1"
                                            onClick={() => {
                                                setIsEditing(false);
                                                // Optionally reset form to original session values if needed
                                                // form.reset({ ... });
                                            }}
                                            disabled={isLoading}
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        ) : (
                            // VIEWING MODE: Show the display component
                            <div className="space-y-6">
                                {' '}
                                {/* Wrapper for display + button */}
                                <UserProfileDisplay user={session.user} />
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full"
                                >
                                    Редактировать профиль
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
