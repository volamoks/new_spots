'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Session } from 'next-auth'; // Assuming Session type is available

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
import InnField from './InnField'; // Import the extracted InnField component
// Import only the type, not the schema object
import { ProfileFormData } from './profileSchema';
interface ProfileEditFormProps {
    form: UseFormReturn<ProfileFormData>;
    onSubmit: (values: ProfileFormData) => void; // Keep it simple, parent handles async/loading
    onCancel: () => void;
    isLoading: boolean;
    session: Session; // Assuming session is guaranteed to be non-null here
}

export default function ProfileEditForm({
    form,
    onSubmit,
    onCancel,
    isLoading,
    session,
}: ProfileEditFormProps) {
    return (
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
                            <FormDescription>Email нельзя изменить.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Conditional fields based on user role from session */}
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
                                        placeholder="Введите номер вашей категории"
                                        // Ensure value is always a string for the Input component
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {session.user.role === 'SUPPLIER' && (
                    // Use the extracted InnField component - type should now match
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
                        onClick={onCancel} // Use the onCancel prop
                        disabled={isLoading}
                    >
                        Отмена
                    </Button>
                </div>
            </form>
        </Form>
    );
}
