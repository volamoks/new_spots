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
    currentValue: string | null | undefined; // This likely holds the supplier INN or Name currently
    onSave: (value: string | null) => Promise<void>; // Expects to receive INN or custom name
    isDisabled?: boolean;
}

const OTHER_SUPPLIER_VALUE = '__OTHER__';
const NONE_SUPPLIER_VALUE = '__NONE__'; // Consistent value for 'no supplier'

export function EditableSupplierCell({
    zoneId,
    currentValue,
    onSave,
    isDisabled = false,
}: EditableSupplierCellProps) {
    // --- Store State ---
    const { suppliers, fetchSuppliers, isLoading: isLoadingSuppliers } = useSupplierStore();

    // --- Component State ---
    const [isEditing, setIsEditing] = useState(false);
    // selectedValue should store the INN or special values like __NONE__, __OTHER__
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState<string>(''); // For 'Other' input
    const [showInput, setShowInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentSupplierName, setCurrentSupplierName] = useState<string | null>(null); // Store name separately

    // --- Derived Data ---
    // Use INN as value, name as label for options
    const options = suppliers.map(s => ({ value: s.inn, label: s.name }));

    // --- Effects ---
    // Fetch suppliers when editing starts
    useEffect(() => {
        if (isEditing && suppliers.length === 0) {
            fetchSuppliers();
        }
    }, [isEditing, suppliers.length, fetchSuppliers]);

    // Sync local state with external currentValue changes and supplier list
    useEffect(() => {
        // Find the supplier object matching the currentValue (which might be INN or Name)
        const currentSupplier = suppliers.find(
            s => s.inn === currentValue || s.name === currentValue,
        );

        if (currentSupplier) {
            // Found in list - use INN as selectedValue, store name
            setSelectedValue(currentSupplier.inn);
            setCurrentSupplierName(currentSupplier.name);
            setShowInput(false);
            setInputValue('');
        } else if (currentValue) {
            // Not found in list, but has a value - treat as 'Other'
            setSelectedValue(OTHER_SUPPLIER_VALUE);
            setCurrentSupplierName(currentValue); // Display the custom value
            setShowInput(true);
            setInputValue(currentValue);
        } else {
            // No current value
            setSelectedValue(null);
            setCurrentSupplierName(null);
            setShowInput(false);
            setInputValue('');
        }
    }, [currentValue, suppliers]); // Depend on suppliers from store

    // --- Handlers ---
    const handleEdit = () => {
        setIsEditing(true);
        // Initial state is set by the useEffect above based on currentValue and suppliers
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset state based on original currentValue and suppliers list (handled by useEffect)
    };

    const handleSave = async () => {
        setIsSaving(true);
        let nameToSave: string | null = null; // Variable to hold the name to be saved

        if (selectedValue === OTHER_SUPPLIER_VALUE) {
            // If 'Other', save the trimmed input value (custom name)
            nameToSave = inputValue.trim() || null;
        } else if (selectedValue === NONE_SUPPLIER_VALUE) {
            // If 'None', save null
            nameToSave = null;
        } else if (selectedValue) {
            // Find the supplier object by INN (selectedValue holds the INN)
            const selectedSupplier = suppliers.find(s => s.inn === selectedValue);
            nameToSave = selectedSupplier ? selectedSupplier.name : null; // Get the name
        } else {
            nameToSave = null; // No selection
        }

        const normalizedCurrentValue = currentValue || null;
        const normalizedNameToSave = nameToSave || null;

        // Only save if the name actually changed
        if (normalizedNameToSave === normalizedCurrentValue) {
            setIsEditing(false);
            setIsSaving(false);
            console.log('Supplier name unchanged, skipping save.');
            return;
        }

        try {
            console.log(`Saving supplier name: ${nameToSave} for zone ${zoneId}`);
            await onSave(nameToSave); // Send NAME or null
            setIsEditing(false);
        } catch (error) {
            console.error(`Failed to save supplier for zone ${zoneId}:`, error);
            // TODO: Add toast with error message
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectChange = (value: string | null) => {
        // Value received here is the INN or special value (__NONE__, __OTHER__)
        setSelectedValue(value);
        if (value === OTHER_SUPPLIER_VALUE) {
            setShowInput(true);
            // Don't clear input if switching to 'Other'
        } else {
            setShowInput(false);
            setInputValue(''); // Clear input if selecting from list or 'None'
        }
    };

    // --- Render Logic ---
    // Display the stored name if available, otherwise the raw currentValue, or '-'
    const displayValue = currentSupplierName || currentValue || '-';
    const totalLoading = isDisabled || isSaving || isLoadingSuppliers;

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between group min-h-[32px]">

                <span
                    title={displayValue}
                    className="truncate"
                >
                    {displayValue}
                </span>{' '}
                {/* Add title for overflow */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    disabled={totalLoading}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" // Prevent shrinking, add margin
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
                options={options} // Options now use INN as value
                value={selectedValue} // selectedValue holds INN or special value
                onChange={handleSelectChange}
                isDisabled={totalLoading}
                triggerPlaceholder="Выберите или введите"
                noValueOption={{ value: NONE_SUPPLIER_VALUE, label: '- Нет -' }}
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
