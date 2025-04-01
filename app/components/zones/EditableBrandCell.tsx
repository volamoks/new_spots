// File: app/components/zones/EditableBrandCell.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableBrandCellProps {
    zoneId: string;
    currentValue: string | null | undefined;
    onSave: (value: string | null) => Promise<void>;
    isDisabled?: boolean;
}

export function EditableBrandCell({
    zoneId,
    currentValue,
    onSave,
    isDisabled = false,
}: EditableBrandCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState<string>(currentValue || '');
    const [isLoading, setIsLoading] = useState(false);

    // Синхронизация inputValue с currentValue при изменении извне
    useEffect(() => {
        setInputValue(currentValue || '');
    }, [currentValue]);

    const handleEdit = () => {
        setIsEditing(true);
        setInputValue(currentValue || ''); // Устанавливаем текущее значение при входе в редактирование
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputValue(currentValue || ''); // Сбрасываем к исходному
    };

    const handleSave = async () => {
        setIsLoading(true);
        const valueToSave = inputValue.trim() || null; // Сохраняем значение из инпута, если не пустое

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
            console.error(`Failed to save brand for zone ${zoneId}:`, error);
            // Можно добавить toast с ошибкой
        } finally {
            setIsLoading(false);
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
                    aria-label="Редактировать бренд"
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1">
            <Input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Введите бренд"
                className="h-8 text-xs"
                disabled={isLoading}
            />
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
