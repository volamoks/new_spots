'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ZoneFilterDropdownProps {
  title: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

export function SimpleZoneFilterDropdown({
  title,
  options,
  selected,
  onChange,
  placeholder = "Поиск...",
  isDisabled = false,
  className = "",
}: ZoneFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Ensure selected is an array
  const safeSelected = Array.isArray(selected) ? selected : [];

  // Закрываем попап при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Обработчик выбора/отмены выбора опции
  const handleSelect = (value: string) => {
    const newSelected = safeSelected.includes(value)
      ? safeSelected.filter(item => item !== value)
      : [...safeSelected, value];
    
    onChange(newSelected);
  };

  // Фильтрация опций по поисковому запросу
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn(
            "justify-between", 
            className, 
            safeSelected.length > 0 ? "border-primary" : ""
          )}
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
      <PopoverContent className="p-0 w-[200px]" align="start">
        <div ref={popoverRef} className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
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
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                    safeSelected.includes(option.value) ? "bg-accent" : ""
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      safeSelected.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
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
