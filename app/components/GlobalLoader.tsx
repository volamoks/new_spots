'use client';

import React from 'react';
import { create } from 'zustand';

// Интерфейс для store лоадера
interface LoaderStore {
    isLoading: boolean;
    message: string;
    setLoading: (isLoading: boolean, message?: string) => void;
}

// Создаем глобальный store для управления состоянием лоадера
export const useLoaderStore = create<LoaderStore>(set => ({
    isLoading: false,
    message: 'Загрузка...',
    setLoading: (isLoading, message = 'Загрузка...') => set({ isLoading, message }),
}));

// Компонент лоадера, который будет отображаться при загрузке
export function GlobalLoader() {
    const { isLoading, message } = useLoaderStore();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                    <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
                </div>
            </div>
        </div>
    );
}

// Хук для удобного использования лоадера в компонентах
export function useLoader() {
    const { setLoading } = useLoaderStore();

    // Функция для выполнения асинхронных операций с автоматическим отображением лоадера
    const withLoading = async <T,>(promise: Promise<T>, message?: string): Promise<T> => {
        try {
            setLoading(true, message);
            return await promise;
        } finally {
            setLoading(false);
        }
    };

    return { withLoading, setLoading };
}
