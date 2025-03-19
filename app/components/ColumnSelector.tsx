'use client';

import * as React from 'react';
// import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';

type ColumnSelectorProps = {
    columns: string[];
    visibleColumns: string[];
    onColumnToggle: (column: string) => void;
};

export function ColumnSelector({ columns, visibleColumns, onColumnToggle }: ColumnSelectorProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                {/* <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    Выбрать столбцы
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button> */}
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Поиск столбца..." />
                    <CommandList>
                        <CommandEmpty>Столбец не найден.</CommandEmpty>
                        <CommandGroup>
                            {columns.map(column => (
                                <CommandItem
                                    key={column}
                                    onSelect={() => {
                                        onColumnToggle(column);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            visibleColumns.includes(column)
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {column}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
