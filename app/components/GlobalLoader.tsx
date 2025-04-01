'use client';

import React from 'react';
// Import the standardized loader store from the lib directory
import { useLoaderStore } from '@/lib/stores/loaderStore';

// The visual loader component remains, but now uses the standardized store
export function GlobalLoader() {
    // Read state from the standardized store in lib/stores/
    const { isLoading, message } = useLoaderStore();

    if (!isLoading) return null;

    // Default message if the store provides null
    const displayMessage = message || 'Загрузка...';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                    <p className="mt-4 text-center text-sm text-gray-600">{displayMessage}</p>
                </div>
            </div>
        </div>
    );
}

// Removed the redundant internal store definition and useLoader hook
