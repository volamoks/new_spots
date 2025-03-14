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
// import Navigation from "@/components/Navigation"

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

// Custom component for INN field with organization name lookup
function InnField({ control }: { control: Control<z.infer<typeof formSchema>> }) {
    const inn = useWatch({
        control,
        name: "inn"
    });
    
    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
        const fetchOrganizationName = async () => {
            if (inn && inn.length >= 9) {
                setIsSearching(true);
                try {
                    const response = await fetch(`/api/inn/find?inn=${inn}`);
                    if (response.ok) {
                        const data = await response.json();
                        setOrganizationName(data.name);
                    } else {
                        setOrganizationName(null);
                    }
                } catch (error) {
                    console.error("Error fetching organization:", error);
                    setOrganizationName(null);
                } finally {
                    setIsSearching(false);
                }
            }
        };
        
        fetchOrganizationName();
    }, [inn]);
    
    return (
        <FormField
            control={control}
            name="inn"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>ИНН</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    {isSearching && (
                        <FormDescription>
                            Поиск организации...
                        </FormDescription>
                    )}
                    {!isSearching && organizationName && (
                        <FormDescription>
                            Название организации: <strong>{organizationName}</strong>
                        </FormDescription>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            category: '',
            inn: '',
        },
    });

    useEffect(() => {
        if (session?.user) {
            form.reset({
                name: session.user.name || '',
                email: session.user.email || '',
                category: session.user.category || '',
                inn: session.user.inn || '',
            });
        }
    }, [session, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            await update(updatedUser);

            toast({
                title: 'Профиль обновлен',
                description: 'Ваши данные успешно обновлены',
                variant: 'success',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось обновить профиль. Попробуйте позже.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!session) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* <Navigation /> */}
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Профиль пользователя
                        </CardTitle>
                        <CardDescription>
                            Просмотр и редактирование личной информации
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
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
                                                />
                                            </FormControl>
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
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {session.user.role === 'SUPPLIER' && (
                                    <InnField control={form.control} />
                                )}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Обновление...' : 'Обновить профиль'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
