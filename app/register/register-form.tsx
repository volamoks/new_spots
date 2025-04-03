'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Имя пользователя должно содержать не менее 2 символов',
    }),
    email: z.string().email({
        message: 'Пожалуйста, введите корректный email',
    }),
    password: z.string().min(8, {
        message: 'Пароль должен содержать не менее 8 символов',
    }),
    role: z.enum(['SUPPLIER', 'CATEGORY_MANAGER', 'DMP_MANAGER']),
    category: z.string().optional(),
    inn: z.string().optional(),
});

export function RegisterForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'SUPPLIER',
            category: '',
            inn: '',
        },
    });

    const selectedRole = form.watch('role');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                // Handle specific 409 Conflict error from the backend
                if (response.status === 409) {
                    const errorData = await response.json();
                    toast({
                        title: 'Ошибка регистрации',
                        description: errorData.error || 'Данные уже используются.', // Use backend message or fallback
                        variant: 'destructive',
                    });
                } else {
                    // Throw generic error for other non-ok responses
                    throw new Error(`Registration failed with status: ${response.status}`);
                }
                // Stop execution here if not ok
                return;
            }

            const data = await response.json();

            if (data.user.role === 'CATEGORY_MANAGER' && data.user.status === 'PENDING') {
                toast({
                    title: 'Регистрация ожидает подтверждения',
                    description:
                        'Ваша заявка на регистрацию в качестве категорийного менеджера ожидает подтверждения администратором.',
                    variant: 'default', // Or any other variant you prefer
                });
            } else {
                toast({
                    title: 'Успешная регистрация',
                    description: 'Теперь вы можете войти в систему',
                    variant: 'success',
                });
            }

            router.push('/login');
        } catch (error) {
            console.error('Submit Error:', error);
            const isHandled409 =
                error instanceof Error &&
                error.message.startsWith('Registration failed with status:');
            if (!isHandled409) {
                toast({
                    title: 'Ошибка регистрации',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Не удалось зарегистрироваться. Попробуйте позже.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div
            className={cn('grid gap-6', className)}
            {...props}
        >
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
                                    <Input
                                        placeholder="Иван Иванов"
                                        {...field}
                                    />
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
                                        placeholder="ivan@example.com"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Пароль</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Роль</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите роль" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SUPPLIER">Поставщик</SelectItem>
                                        <SelectItem value="CATEGORY_MANAGER">
                                            Категорийный менеджер
                                        </SelectItem>
                                        <SelectItem value="DMP_MANAGER">Менеджер ДМП</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {selectedRole === 'CATEGORY_MANAGER' && (
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Категория</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Введите категорию"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {selectedRole === 'SUPPLIER' && (
                        <FormField
                            control={form.control}
                            name="inn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ИНН</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Введите ИНН"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
