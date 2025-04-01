'use client';

import React, { useState, useEffect } from 'react';
import { Control, useWatch } from 'react-hook-form'; // Removed FieldValues
import { Input } from '@/components/ui/input';
import {
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { ProfileFormData } from './profileSchema'; // Import the specific form data type

// Use the specific Control type based on the shared schema
export default function InnField({ control }: { control: Control<ProfileFormData> }) {
    const inn = useWatch({
        control,
        name: 'inn',
    });

    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchOrganizationName = async () => {
            // Reset state if INN is too short or empty
            // Ensure 'inn' is treated as a string for length check
            const innString = typeof inn === 'string' ? inn : '';
            if (!innString || innString.length < 9) {
                setOrganizationName(null);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/inn/find?inn=${innString}`);
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
                            // Ensure value is always a string for the Input component
                            value={field.value || ''}
                        />
                    </FormControl>
                    {isSearching && <FormDescription>Поиск организации...</FormDescription>}
                    {!isSearching && organizationName && (
                        <FormDescription>
                            Название организации <strong>{organizationName}</strong>
                        </FormDescription>
                    )}
                    {/* Ensure 'inn' is treated as a string for length check here too */}
                    {!isSearching &&
                        typeof inn === 'string' &&
                        inn.length >= 9 &&
                        !organizationName && (
                            <FormDescription className="text-orange-600">
                                Организация не найдена по ИНН.
                            </FormDescription>
                        )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
