'use client';

import { useState } from 'react'; // Removed useRef, useEffect
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react'; // Use ChevronsUpDown
import { cn } from '@/lib/utils';
// Import Command components
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
// Removed Input import

// Generic interface for filter criteria objects
interface ZoneFilterDropdownProps<T> {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string[]; // Keep as array for multi-select
    placeholder?: string; // Placeholder for CommandInput
    emptySearchText?: string; // Text for CommandEmpty
    isDisabled?: boolean;
    className?: string;
    filterKey: keyof T & string;
    setFilterCriteria: (criteria: Partial<T>) => void;
}

export function SimpleZoneFilterDropdown<T>({
    title,
    options,
    selected,
    placeholder = 'Поиск...',
    emptySearchText = 'Ничего не найдено',
    isDisabled = false,
    className = '',
    filterKey,
    setFilterCriteria,
}: ZoneFilterDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    // Removed searchValue state - CommandInput handles its own state
    // Removed popoverRef

    // Ensure selected is always an array
    const safeSelected = Array.isArray(selected) ? selected : [];

    // Removed useEffect for click outside

    // Handles selecting/deselecting an option (logic remains the same)
    const handleSelect = (value: string) => {
        const newSelected = safeSelected.includes(value)
            ? safeSelected.filter(item => item !== value)
            : [...safeSelected, value];
        setFilterCriteria({ [filterKey]: newSelected } as Partial<T>);
    };

    // Removed manual filtering logic - Command handles filtering

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isDisabled}
                    className={cn('w-full justify-between', className)} // Ensure w-full
                >
                    <span className="truncate">
                        {title} {safeSelected.length > 0 && `(${safeSelected.length})`}
                    </span>
                    {/* Use ChevronsUpDown consistently */}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                {/* Use Command structure */}
                <Command>
                    <CommandInput placeholder={placeholder} />
                    <CommandList>
                        <CommandEmpty>{emptySearchText}</CommandEmpty>
                        <CommandGroup>
                            {/* Map options to CommandItem */}
                            {options.map(option => {
                                const isSelected = safeSelected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Value used for Command filtering
                                        onSelect={() => {
                                            // Call handleSelect to toggle selection state
                                            handleSelect(option.value);
                                            // Keep the popover open for multi-select
                                            // We don't call setOpen(false) here
                                        }}
                                        // Prevent default CommandItem behavior which closes popover
                                        // This might not be strictly necessary depending on Command version/impl,
                                        // but ensures the popover stays open.
                                        // Alternatively, manage 'open' state manually if needed.
                                        // For now, let's rely on not calling setOpen(false) in onSelect.

                                    >
                                        {/* Checkbox representation */}
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible', // Hide checkmark if not selected
                                            )}
                                        >
                                            <Check className={cn('h-4 w-4')} />
                                        </div>
                                        {/* Label */}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
