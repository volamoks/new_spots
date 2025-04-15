'use client';

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react'; // Keep useState
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';

// Define the structure for API items if needed, similar to ApiSelectDropdown
// Define SelectOption locally if not exported from the hook
interface SelectOption {
    value: string;
    label: string;
}

interface ApiItem {
    [key: string]: unknown;
}

// Combine props from SimpleSelectDropdown and ApiSelectDropdown, add mode
interface UniversalDropdownProps<T extends ApiItem = ApiItem> {
    // --- Mode ---
    mode: 'single' | 'multiple';

    // --- Data Source (choose one) ---
    options?: SelectOption[]; // Static options
    apiUrl?: string; // API endpoint for async options
    valueField?: keyof T; // Field for option value (async)
    labelField?: keyof T; // Field for option label (async)
    initialFetchLimit?: number;
    searchParam?: string;
    limitParam?: string;
    debounceDelay?: number;
    loaderMessage?: string;
    errorMessage?: string;

    // --- Selection ---
    // Use union type for selected value based on mode
    selected: string | null | string[];
    onChange: (value: string | null | string[]) => void; // Adjust callback based on mode

    // --- UI Customization ---
    title?: string; // Optional title for context
    placeholder?: string; // Placeholder for CommandInput
    triggerPlaceholder?: string; // Placeholder for the trigger button
    clearSelectionText?: string; // Text for clear option (single mode mainly)
    emptySearchText?: string; // Text when search yields no results
    isDisabled?: boolean;
    className?: string; // Class for the trigger button
    popoverClassName?: string; // Class for the PopoverContent
}

export function UniversalDropdown<T extends ApiItem = ApiItem>({
    mode,
    // Data source props
    options: staticOptions,
    apiUrl,
    valueField,
    labelField,
    initialFetchLimit,
    searchParam,
    limitParam,
    debounceDelay,
    loaderMessage,
    errorMessage,
    // Selection props
    selected,
    onChange,
    // UI props
    title,
    placeholder = 'Поиск...',
    triggerPlaceholder = 'Выберите...',
    clearSelectionText = '-- Не выбрано --', // Relevant for single select
    emptySearchText = 'Ничего не найдено.',
    isDisabled = false,
    className = '',
    popoverClassName = '',
}: UniversalDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    // Remove internalSearchQuery state as it's no longer needed
    // const [internalSearchQuery, setInternalSearchQuery] = useState('');

    // Determine if using async data fetching
    const isAsync = !!apiUrl && !!valueField && !!labelField;

    // Fetch options if async (Call hook unconditionally)
    // Destructure handleSearchChange even if it's not used to avoid breaking changes if the hook still returns it
    // Or adjust the hook not to return it anymore (preferred)
    const {
        options: asyncOptions,
        isLoading,
        handleSearchChange, // Ensure handleSearchChange is destructured
    } = useSelectOptions<T>(
        isAsync
            ? {
                  apiUrl: apiUrl!, // Assert non-null as we checked isAsync
                  valueField: valueField!,
                  labelField: labelField!,
                  initialFetchLimit,
                  searchParam,
                  limitParam,
                  debounceDelay,
                  loaderMessage,
                  errorMessage,
              }
            : { apiUrl: '', valueField: '', labelField: '' }, // Provide dummy values if not async
    );

    const options = isAsync ? asyncOptions : staticOptions ?? [];
    const effectiveIsDisabled = isDisabled || (isAsync && isLoading);

    // --- Helper function to get display label(s) for the trigger ---
    const getTriggerLabel = (): string => {
        if (mode === 'single') {
            if (selected === null || typeof selected !== 'string') return triggerPlaceholder;
            const selectedOption = options.find(opt => opt.value === selected);
            const label = selectedOption?.label ?? selected; // Fallback to value if label not found
            return title ? `${title}: ${label}` : label;
        } else {
            // Multiple mode
            if (!Array.isArray(selected) || selected.length === 0) return triggerPlaceholder;
            if (selected.length === 1) {
                const selectedOption = options.find(opt => opt.value === selected[0]);
                const label = selectedOption?.label ?? selected[0];
                return title ? `${title}: ${label}` : label;
            }
            return title
                ? `${title}: Выбрано (${selected.length})`
                : `Выбрано (${selected.length})`;
        }
    };

    // Memoize getTriggerLabel
    const triggerLabel = useMemo(
        () => getTriggerLabel(),
        [selected, options, title, triggerPlaceholder],
    );

    // Filter function removed - using Command's default filtering

    // --- Handle selection logic ---
    const handleSelect = useCallback(
        (optionValue: string | null) => {
            if (mode === 'single') {
                onChange(optionValue); // Pass null or the selected value
                setOpen(false); // Close on select for single mode
            } else {
                // Multiple mode
                const currentSelected = Array.isArray(selected) ? selected : [];
                let newSelected: string[];
                if (optionValue === null) {
                    // Should not happen in multi-select normally
                    newSelected = currentSelected;
                } else if (currentSelected.includes(optionValue)) {
                    newSelected = currentSelected.filter(val => val !== optionValue); // Deselect
                } else {
                    newSelected = [...currentSelected, optionValue]; // Select
                }
                onChange(newSelected);
                // Keep popover open for multi-select
            }
        },
        [mode, selected, onChange],
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
                    disabled={effectiveIsDisabled}
                    className={cn('w-full justify-between', className)}
                >
                    <span className="truncate">{triggerLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    'w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0',
                    popoverClassName,
                )}
            >
                <Command>
                    {' '}
                    {/* filter prop removed */}
                    <CommandInput
                        placeholder={placeholder}
                        // value prop remains removed
                        onValueChange={isAsync ? handleSearchChange : undefined} // Call hook's search handler if async
                        disabled={effectiveIsDisabled}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? loaderMessage ?? 'Загрузка...' : emptySearchText}
                        </CommandEmpty>
                        <CommandGroup>
                            {/* Clear selection option (only for single mode) */}
                            {mode === 'single' && (
                                <CommandItem
                                    key="clear-selection"
                                    value="__clear__" // Special value
                                    onSelect={() => handleSelect(null)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selected === null || selected === undefined
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {clearSelectionText}
                                </CommandItem>
                            )}
                            {/* Options */}
                            {options.map(option => {
                                const isSelected =
                                    mode === 'single'
                                        ? selected === option.value
                                        : Array.isArray(selected) &&
                                          selected.includes(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Value used for filtering and display
                                        onSelect={() => handleSelect(option.value)}
                                        // Prevent closing on select for multi-select? Command might handle this. Test needed.
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                isSelected ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        {option.label}
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

// Re-export SelectOption if it's defined in useSelectOptions or define it here
// export type { SelectOption };
