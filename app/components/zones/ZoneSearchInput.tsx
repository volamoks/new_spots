'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ZoneSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

export function ZoneSearchInput({
  value,
  onChange,
  placeholder = "Поиск по городу, магазину, макрозоне...",
  isDisabled = false,
  className = "",
}: ZoneSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className="pl-9 w-full"
      />
    </div>
  );
}
