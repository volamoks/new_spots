// File: app/components/zones/SearchableSelect.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string | null; // Текущее выбранное значение
    onChange: (value: string | null) => void; // Функция обратного вызова при изменении
    placeholder?: string; // Плейсхолдер для поля поиска
    triggerPlaceholder?: string; // Плейсхолдер для кнопки-триггера
    noValueOption?: SearchableSelectOption; // Опция для сброса значения (напр., "- Нет -")
    otherOption?: SearchableSelectOption; // Опция для ввода своего значения (напр., "Другой...")
    isDisabled?: boolean;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Поиск...',
    triggerPlaceholder = 'Выберите...',
    noValueOption = { value: '__NONE__', label: '- Нет -' },
    otherOption = { value: '__OTHER__', label: 'Другой...' },
    isDisabled = false,
    className = '',
}: SearchableSelectProps) {
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Обработчик выбора опции
    const handleSelect = (selectedValue: string | null) => {
        onChange(selectedValue);
        setOpen(false); // Закрываем попап после выбора
        setSearchValue(''); // Сбрасываем поиск
    };

    // Формируем полный список опций, включая специальные
    const allOptions: SearchableSelectOption[] = [noValueOption, ...options, otherOption];

    // Фильтрация опций по поисковому запросу
    const filteredOptions = allOptions.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );

    // Находим метку для текущего выбранного значения
    const selectedLabel =
        allOptions.find(option => option.value === value)?.label || triggerPlaceholder;

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
                    className={cn('justify-between w-full h-8 text-xs', className)} // Адаптируем стили
                >
                    <span className="truncate">{selectedLabel}</span>
                    {open ? (
                        <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width]"
                align="start"
            >
                {' '}
                {/* Ширина как у триггера */}
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
                            autoFocus
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
                                        'flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer hover:bg-accent', // Уменьшен шрифт до text-xs
                                        value === option.value ? 'bg-accent' : '',
                                    )}
                                    onClick={() =>
                                        handleSelect(
                                            option.value === noValueOption.value
                                                ? null
                                                : option.value,
                                        )
                                    } // Передаем null для опции "Нет"
                                >
                                    {/* Показываем иконку Check только для выбранного элемента */}
                                    {value === option.value && <Check className="mr-2 h-4 w-4" />}
                                    {/* Убираем пустой div, чтобы убрать отступ для невыбранных */}
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
