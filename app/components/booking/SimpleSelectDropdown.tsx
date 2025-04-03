'use client';

import { useState } from 'react'; // Removed useRef and useEffect
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// Use ChevronsUpDown consistently, import Check
import { Check, ChevronsUpDown } from 'lucide-react';
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

interface SimpleSelectDropdownProps {
    title: string; // Changed label to title for consistency with original prop name
    options: Array<{ value: string; label: string }>;
    selected: string | null;
    selectedLabel?: string; // Explicitly pass the label for the selected value
    onChange: (value: string | null) => void;
    onSearchChange?: (search: string) => void;
    placeholder?: string; // Placeholder for CommandInput
    triggerPlaceholder?: string; // Placeholder for the trigger button when nothing selected
    clearSelectionText?: string; // Text for clear option
    emptySearchText?: string; // Text when search yields no results
    isDisabled?: boolean;
    className?: string;
}

export function SimpleSelectDropdown({
    title, // Use title
    options,
    selected,
    selectedLabel, // Add selectedLabel prop
    onChange,
    onSearchChange,
    placeholder = 'Поиск...', // For CommandInput
    triggerPlaceholder = 'Выберите...', // Default trigger placeholder
    clearSelectionText = '-- Не выбрано --',
    emptySearchText = 'Ничего не найдено.',
    isDisabled = false,
    className = '',
}: SimpleSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    // searchValue is now handled internally by CommandInput, but we might need it if filtering is manual
    // const [searchValue, setSearchValue] = useState(''); // Keep if manual filtering needed

    // Removed popoverRef and click outside logic, Popover handles this

    // Filter function for Command (case-insensitive substring match)
    // cmdk expects the filter function to return a number (1 for match, 0 for no match)
    const filter = (value: string, search: string): number => {
        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
    };

    // Use the passed selectedLabel prop directly for display

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
                    disabled={isDisabled}
                    className={cn('w-full justify-between', className)} // Ensure w-full is applied if needed
                >
                    <span className="truncate">
                        {/* Display title and selected label, or trigger placeholder */}
                        {selected && selectedLabel
                            ? `${title}: ${selectedLabel}`
                            : triggerPlaceholder}
                    </span>
                    {/* Use ChevronsUpDown consistently */}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            {/* Adjust width and height constraints as needed */}
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                {/* Use Command component structure */}
                <Command filter={filter}>
                    <CommandInput
                        placeholder={placeholder}
                        onValueChange={onSearchChange} // Call the callback on input change
                    />
                    <CommandList>
                        <CommandEmpty>{emptySearchText}</CommandEmpty>
                        <CommandGroup>
                            {/* Option to clear selection */}
                            <CommandItem
                                key="clear-selection"
                                value="" // Use a distinct value or handle specially
                                onSelect={() => {
                                    onChange(null); // Pass null to indicate clearing
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        selected === null ? 'opacity-100' : 'opacity-0', // Check if selected is null
                                    )}
                                />
                                {clearSelectionText}
                            </CommandItem>
                            {/* Map options to CommandItem */}
                            {options.map(option => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Command uses this for filtering/display
                                    onSelect={currentValue => {
                                        // Find the option based on the label selected in Command
                                        const selectedOption = options.find(
                                            opt => opt.label === currentValue,
                                        );
                                        onChange(selectedOption ? selectedOption.value : null);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selected === option.value ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
