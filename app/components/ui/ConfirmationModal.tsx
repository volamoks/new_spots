import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Corrected import path

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode; // Allow React nodes for description flexibility
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'default' | 'destructive'; // Optional variant for confirm button styling
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
}: ConfirmationModalProps) {
    // We control the dialog purely through the 'isOpen' prop from the parent
    if (!isOpen) {
        return null;
    }

    const handleConfirm = () => {
        onConfirm();
        // onClose(); // Let the parent decide when to close after confirm if needed
    };

    return (
        // Use onOpenChange for closing via overlay click or Escape key
        <AlertDialog
            open={isOpen}
            onOpenChange={(open: boolean) => !open && onClose()}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>{cancelText}</AlertDialogCancel>
                    {/* Apply destructive variant styles if specified */}
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            confirmVariant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : ''
                        }
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
