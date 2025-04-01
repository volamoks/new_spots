'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
// Removed useRouter import
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import UserProfileDisplay from '@/app/components/profile/UserProfileDisplay';
import ProfileEditForm from '@/app/components/profile/ProfileEditForm';
import { profileFormSchema, ProfileFormData } from '@/app/components/profile/profileSchema';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Import global loader store

export default function UserProfilePageContent() {
    const { data: session, update } = useSession();
    const { toast } = useToast();
    const { withLoading, isLoading } = useLoaderStore(); // Use global loader
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode

    // Use the imported schema and type for useForm
    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileFormSchema),
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
    }, [session, form]);

    // Use the imported type for onSubmit values
    async function onSubmit(values: ProfileFormData) {
        // Define the async operation
        const updateProfilePromise = async () => {
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

                // Return true on success (or updatedUser if needed)
                return true;
            } catch (error) {
                console.error('Profile update error:', error);
                let errorMessage = 'Не удалось обновить профиль. Попробуйте позже.';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                // Re-throw or handle error appropriately for withLoading
                // Here, we'll show toast and return false
                toast({
                    title: 'Ошибка обновления',
                    description: errorMessage,
                    variant: 'destructive',
                });
                return false; // Indicate failure
            }
        };

        // Wrap the promise execution with the loader
        const success = await withLoading(
            updateProfilePromise(), // Execute the function to get the promise
            'Обновление профиля...', // Loading message
        );

        // Handle post-update actions based on success
        if (success) {
            toast({
                title: 'Профиль обновлен',
                description: 'Ваши данные успешно обновлены.',
                variant: 'success',
            });
            setIsEditing(false); // Switch back to view mode only on success
        }
        // Error toast is handled within updateProfilePromise for simplicity
    }

    // Conditional rendering using a variable
    let profileContent;
    if (isEditing) {
        profileContent = (
            <ProfileEditForm
                form={form}
                onSubmit={onSubmit}
                onCancel={() => setIsEditing(false)}
                isLoading={isLoading} // Pass global loading state
                session={session!} // Assert session is not null here as parent handles it
            />
        );
    } else {
        profileContent = (
            <div className="space-y-6">
                {/* Ensure session.user exists before passing */}
                {session?.user && <UserProfileDisplay user={session.user} />}
                <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                    disabled={!session?.user} // Disable if user data isn't loaded yet
                >
                    Редактировать профиль
                </Button>
            </div>
        );
    }

    // Main component structure remains similar, but content is dynamic
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card>
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
                        {profileContent} {/* Render the dynamic content */}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
