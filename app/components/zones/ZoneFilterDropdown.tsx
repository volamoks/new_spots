'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoneFilterDropdownProps {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    className?: string;
}

export function ZoneFilterDropdown({
    title,
    options,
    selected,
    onChange,
    placeholder = 'Поиск...',
    isDisabled = false,
    className = '',
}: ZoneFilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const commandRef = useRef<HTMLDivElement>(null);

    // Закрываем попап при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Обработчик выбора/отмены выбора опции
    const handleSelect = (value: string) => {
        // Убедимся, что selected - это массив
        const safeSelected = Array.isArray(selected) ? selected : [];

        const newSelected = safeSelected.includes(value)
            ? safeSelected.filter(item => item !== value)
            : [...safeSelected, value];

        onChange(newSelected);
    };

    // Фильтрация опций по поисковому запросу
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
                    className={cn(
                        'justify-between',
                        className,
                        Array.isArray(selected) && selected.length > 0 ? 'border-primary' : '',
                    )}
                >
                    <span className="truncate">
                        {title}{' '}
                        {Array.isArray(selected) && selected.length > 0 && `(${selected.length})`}
                    </span>
                    {open ? (
                        <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[200px]"
                align="start"
            >
                <Command ref={commandRef}>
                    <CommandInput
                        placeholder={placeholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandEmpty>Ничего не найдено</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.map(option => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleSelect(option.value)}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                            Array.isArray(selected) &&
                                                selected.includes(option.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'opacity-50',
                                        )}
                                    >
                                        {Array.isArray(selected) &&
                                            selected.includes(option.value) && (
                                                <Check className="h-3 w-3" />
                                            )}
                                    </div>
                                    <span>{option.label}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
