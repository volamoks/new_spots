'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// Generic interface for filter criteria objects
interface ZoneFilterDropdownProps<T> {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string[];
    placeholder?: string;
    isDisabled?: boolean;
    className?: string;
    filterKey: keyof T & string; // The key in the filter criteria object to update
    setFilterCriteria: (criteria: Partial<T>) => void; // Function to update the filter criteria state
}

export function SimpleZoneFilterDropdown<T>({
    title,
    options,
    selected,
    placeholder = 'Поиск...', // Default search placeholder text
    isDisabled = false,
    className = '',
    filterKey,
    setFilterCriteria,
}: ZoneFilterDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    // Ensure selected is an array
    const safeSelected = Array.isArray(selected) ? selected : [];

    // Close popover when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click is outside the popover content area
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // Handles selecting/deselecting an option
    const handleSelect = (value: string) => {
        // Toggle the presence of the value in the selected array
        const newSelected = safeSelected.includes(value)
            ? safeSelected.filter(item => item !== value) // Remove if already selected
            : [...safeSelected, value]; // Add if not selected

        // Update the parent component's filter criteria state
        // The type assertion is used because TypeScript cannot guarantee
        // that filterKey is a valid key of Partial<T> dynamically here.
        setFilterCriteria({ [filterKey]: newSelected } as Partial<T>);
    };

    // Filter options based on the search input value (case-insensitive)
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );

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
                    className={cn('justify-between', className)}
                >
                    <span className="truncate">
                        {title} {safeSelected.length > 0 && `(${safeSelected.length})`}
                    </span>
                    {open ? (
                        <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-full"
                align="start"
            >
                <div
                    ref={popoverRef}
                    className="flex flex-col"
                >
                    <div className="flex items-center border-b px-3">
                        <Input
                            placeholder={placeholder}
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>

                    {/* Display message if no options match the search */}
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm">Ничего не найдено</div> // TODO: Consider internationalization (i18n) for this text
                    ) : (
                        // Scrollable list of filtered options
                        <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        'flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent',
                                        safeSelected.includes(option.value) ? 'bg-accent' : '',
                                    )}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <div
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                            safeSelected.includes(option.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'opacity-50',
                                        )}
                                    >
                                        {safeSelected.includes(option.value) && (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </div>
                                    <span>{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
