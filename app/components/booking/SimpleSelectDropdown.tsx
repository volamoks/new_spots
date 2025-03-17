'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SimpleSelectDropdownProps {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    className?: string;
}

export function SimpleSelectDropdown({
    title,
    options,
    selected,
    onChange,
    placeholder = 'Поиск...',
    isDisabled = false,
    className = '',
}: SimpleSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    // Закрываем попап при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Обработчик выбора опции
    const handleSelect = (value: string) => {
        onChange(value);
        setOpen(false);
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
                    className={cn('justify-between', className)}
                >
                    <span className="truncate">
                        {title} {selected && `: ${options.find(o => o.value === selected)?.label}`}
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

                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm">Ничего не найдено</div>
                    ) : (
                        <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        'flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent',
                                        selected === option.value ? 'bg-accent' : '',
                                    )}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    
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
