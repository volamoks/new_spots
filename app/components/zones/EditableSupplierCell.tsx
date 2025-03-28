// File: app/components/zones/EditableSupplierCell.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableSupplierCellProps {
    zoneId: string;
    currentValue: string | null | undefined;
    supplierList: string[];
    onSave: (value: string | null) => Promise<void>;
    isDisabled?: boolean;
}

const OTHER_SUPPLIER_VALUE = '__OTHER__';

export function EditableSupplierCell({
    zoneId,
    currentValue,
    supplierList,
    onSave,
    isDisabled = false,
}: EditableSupplierCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string | null>(currentValue || null);
    const [inputValue, setInputValue] = useState<string>('');
    const [showInput, setShowInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Синхронизация selectedValue с currentValue при изменении извне
    useEffect(() => {
        setSelectedValue(currentValue || null);
        // Скрываем инпут, если текущее значение есть в списке
        if (currentValue && supplierList.includes(currentValue)) {
            setShowInput(false);
            setInputValue('');
        } else if (currentValue) {
            // Показываем инпут, если текущее значение не в списке
            setShowInput(true);
            setInputValue(currentValue);
            setSelectedValue(OTHER_SUPPLIER_VALUE); // Устанавливаем Select в "Другой"
        } else {
            setShowInput(false);
            setInputValue('');
        }
    }, [currentValue, supplierList]);

    const handleEdit = () => {
        setIsEditing(true);
        // Устанавливаем начальное состояние при входе в режим редактирования
        if (currentValue && !supplierList.includes(currentValue)) {
            setSelectedValue(OTHER_SUPPLIER_VALUE);
            setInputValue(currentValue);
            setShowInput(true);
        } else {
            setSelectedValue(currentValue || null);
            setInputValue('');
            setShowInput(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Сбрасываем значения к исходным
        setSelectedValue(currentValue || null);
        setInputValue(currentValue && !supplierList.includes(currentValue) ? currentValue : '');
        setShowInput(currentValue ? !supplierList.includes(currentValue) : false);
    };

    const handleSave = async () => {
        setIsLoading(true);
        let valueToSave: string | null = null;

        if (selectedValue === OTHER_SUPPLIER_VALUE) {
            valueToSave = inputValue.trim() || null; // Сохраняем значение из инпута, если не пустое
        } else {
            valueToSave = selectedValue; // Сохраняем значение из селекта
        }

        // Не сохраняем, если значение не изменилось
        if (valueToSave === (currentValue || null)) {
            setIsEditing(false);
            setIsLoading(false);
            return;
        }

        try {
            await onSave(valueToSave);
            setIsEditing(false);
        } catch (error) {
            console.error(`Failed to save supplier for zone ${zoneId}:`, error);
            // Можно добавить toast с ошибкой
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChange = (value: string) => {
        setSelectedValue(value);
        if (value === OTHER_SUPPLIER_VALUE) {
            setShowInput(true);
            // Не очищаем inputValue, если он уже был заполнен
        } else {
            setShowInput(false);
            setInputValue(''); // Очищаем инпут при выборе из списка
        }
    };

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between group">
                <span>{currentValue || '-'}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isDisabled}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Редактировать поставщика"
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1">
            <Select
                value={selectedValue ?? ''}
                onValueChange={handleSelectChange}
                disabled={isLoading}
            >
                <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Выберите или введите" />
                </SelectTrigger>
                <SelectContent>
                    {/* Используем '__NONE__' вместо пустой строки */}
                    <SelectItem value="__NONE__">- Нет -</SelectItem>
                    {supplierList.map(supplier => (
                        <SelectItem
                            key={supplier}
                            value={supplier}
                        >
                            {supplier}
                        </SelectItem>
                    ))}
                    <SelectItem value={OTHER_SUPPLIER_VALUE}>Другой...</SelectItem>
                </SelectContent>
            </Select>

            {showInput && (
                <Input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Введите поставщика"
                    className="h-8 text-xs"
                    disabled={isLoading}
                />
            )}

            <div className="flex justify-end space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    <Check className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
