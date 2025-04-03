'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react'; // Import more hooks
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';

interface Brand {
    id: string;
    name: string;
    supplierInn?: string | null;
}

interface BrandSelectorProps {
    value: string | null; // Currently selected brand ID
    onChange: (value: string | null) => void; // Callback when selection changes
    disabled?: boolean;
}

export function BrandSelector({ value, onChange, disabled }: BrandSelectorProps) {
    const [open, setOpen] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounce timeout

    // Define the fetch function
    const fetchBrands = useCallback(async (search = '') => {
        // No need to redefine fetchBrands inside useCallback
        setIsLoading(true);
        setError(null);
        try {
            // Add search query parameter
            const apiUrl = search
                ? `/api/brands?search=${encodeURIComponent(search)}`
                : '/api/brands';
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Brand[] = await response.json();
            setBrands(data);
        } catch (e) {
            console.error('Failed to fetch brands:', e);
            setError('Не удалось загрузить список брендов.');
            toast({
                title: 'Ошибка',
                description: 'Не удалось загрузить список брендов.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, []); // Add empty dependency array for useCallback

    // Initial fetch on mount
    useEffect(() => {
        fetchBrands();
    }, []); // Empty dependency array means run once on mount

    // Debounced fetch on search term change
    useEffect(() => {
        // Clear existing timeout if there is one
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set a new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            console.log('Debounced fetch for:', searchTerm);
            fetchBrands(searchTerm);
        }, 500); // 500ms debounce delay

        // Cleanup function to clear timeout if component unmounts or searchTerm changes again
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm]); // Re-run effect when searchTerm changes

    // Find selected brand name from the *current* list of brands
    const selectedBrandName = brands.find(brand => brand.id === value)?.name;
    // If the selected brand isn't in the current list (e.g., due to search),
    // we might need a way to display its name if `value` is set.
    // This could involve fetching the specific brand by ID if `value` exists but `selectedBrandName` is undefined.
    // For simplicity now, it will show "Выберите бренд..." if not found in the current list.

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled || isLoading || !!error}
                >
                    {isLoading
                        ? 'Загрузка брендов...'
                        : error
                        ? error
                        : value
                        ? selectedBrandName ?? 'Выберите бренд...'
                        : 'Выберите бренд...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command filter={() => 1}>
                    {' '}
                    {/* Disable default filtering, rely on API search */}
                    <CommandInput
                        placeholder="Поиск бренда..."
                        value={searchTerm}
                        onValueChange={setSearchTerm} // Update search term state
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading
                                ? 'Загрузка...'
                                : searchTerm
                                ? 'Бренды не найдены.'
                                : 'Начните ввод для поиска...'}
                        </CommandEmpty>
                        <CommandGroup>
                            {/* Option to clear selection */}
                            <CommandItem
                                key="clear-brand"
                                value=""
                                onSelect={() => {
                                    onChange(null); // Set value to null
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === null ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                -- Не выбрано --
                            </CommandItem>
                            {/* Brand options */}
                            {brands.map(brand => (
                                <CommandItem
                                    key={brand.id}
                                    value={brand.name} // Use name for search/display
                                    onSelect={currentValue => {
                                        // Since filtering is disabled, currentValue is the brand name. Find the ID.
                                        const selected = brands.find(b => b.name === currentValue);
                                        onChange(selected ? selected.id : null);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === brand.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    {brand.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
