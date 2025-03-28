// File: app/components/zones/EditableSupplierCell.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from './SearchableSelect'; // Импортируем новый компонент
import { Check, X, Edit2 } from 'lucide-react';
import { useSupplierStore } from '@/lib/stores/supplierStore'; // Import the new supplier store (Removed unused Supplier type)

interface EditableSupplierCellProps {
    zoneId: string;
    currentValue: string | null | undefined;
    // supplierList prop removed
    onSave: (value: string | null) => Promise<void>;
    isDisabled?: boolean;
}

const OTHER_SUPPLIER_VALUE = '__OTHER__';
const NONE_SUPPLIER_VALUE = '__NONE__'; // Consistent value for 'no supplier'

export function EditableSupplierCell({
    zoneId,
    currentValue,
    // supplierList, // Removed
    onSave,
    isDisabled = false,
}: EditableSupplierCellProps) {
    // --- Store State ---
    const { suppliers, fetchSuppliers, isLoading: isLoadingSuppliers } = useSupplierStore();

    // --- Component State ---
    const [isEditing, setIsEditing] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string | null>(currentValue || null);
    const [inputValue, setInputValue] = useState<string>('');
    const [showInput, setShowInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Renamed isLoading to avoid conflict

    // --- Derived Data ---
    // Assuming currentValue and supplier names are stored/compared
    const supplierNames = suppliers.map(s => s.name);
    const options = suppliers.map(s => ({ value: s.name, label: s.name })); // Use name as value/label

    // --- Effects ---
    // Fetch suppliers when editing starts
    useEffect(() => {
        if (isEditing && suppliers.length === 0) {
            fetchSuppliers();
        }
    }, [isEditing, suppliers.length, fetchSuppliers]);

    // Sync local state with external currentValue changes
    useEffect(() => {
        const isInList = currentValue && supplierNames.includes(currentValue);
        setSelectedValue(currentValue || null);

        if (currentValue && !isInList) {
            // Current value exists but is not in the fetched list
            setShowInput(true);
            setInputValue(currentValue);
            setSelectedValue(OTHER_SUPPLIER_VALUE);
        } else {
            // Current value is null or in the list
            setShowInput(false);
            setInputValue('');
            // Keep selectedValue as currentValue (or null)
        }
    }, [currentValue, supplierNames]); // Depend on supplierNames derived from store

    // --- Handlers ---
    const handleEdit = () => {
        setIsEditing(true);
        // Set initial state based on currentValue and fetched list
        const isInList = currentValue && supplierNames.includes(currentValue);
        if (currentValue && !isInList) {
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
        // Reset state based on original currentValue
        const isInList = currentValue && supplierNames.includes(currentValue);
        setSelectedValue(currentValue || null);
        setInputValue(currentValue && !isInList ? currentValue : '');
        setShowInput(currentValue ? !isInList : false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        let valueToSave: string | null = null;

        if (selectedValue === OTHER_SUPPLIER_VALUE) {
            valueToSave = inputValue.trim() || null;
        } else if (selectedValue === NONE_SUPPLIER_VALUE) {
            valueToSave = null; // Explicitly save null for 'None' option
        } else {
            valueToSave = selectedValue;
        }

        // Normalize null/empty string for comparison
        const normalizedCurrentValue = currentValue || null;
        const normalizedValueToSave = valueToSave || null;

        if (normalizedValueToSave === normalizedCurrentValue) {
            setIsEditing(false);
            setIsSaving(false);
            return;
        }

        try {
            await onSave(valueToSave);
            setIsEditing(false);
        } catch (error) {
            console.error(`Failed to save supplier for zone ${zoneId}:`, error);
            // TODO: Add toast with error message
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectChange = (value: string | null) => {
        // Allow null from SearchableSelect
        setSelectedValue(value);
        if (value === OTHER_SUPPLIER_VALUE) {
            setShowInput(true);
        } else {
            setShowInput(false);
            setInputValue('');
        }
    };

    // --- Render Logic ---
    const displayValue = currentValue || '-';
    const totalLoading = isDisabled || isSaving || isLoadingSuppliers;

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between group min-h-[32px]">
                {' '}
                {/* Ensure min height */}
                <span>{displayValue}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    disabled={totalLoading}
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
            <SearchableSelect
                options={options} // Use options derived from store
                value={selectedValue}
                onChange={handleSelectChange}
                isDisabled={totalLoading}
                triggerPlaceholder="Выберите или введите"
                noValueOption={{ value: NONE_SUPPLIER_VALUE, label: '- Нет -' }} // Use consistent NONE value
                otherOption={{ value: OTHER_SUPPLIER_VALUE, label: 'Другой...' }}
            />

            {showInput && (
                <Input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Введите поставщика"
                    className="h-8 text-xs"
                    disabled={totalLoading}
                />
            )}

            <div className="flex justify-end space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={totalLoading}
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={totalLoading}
                >
                    <Check className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
