import { create } from 'zustand';

interface LoaderState {
    isLoading: boolean;
    message: string | null;
    withLoading: <T>(promise: Promise<T>, message: string) => Promise<T>;
}

export const useLoaderStore = create<LoaderState>((set) => ({
    isLoading: false,
    message: null,

    withLoading: async <T>(promise: Promise<T>, message: string) => {
        set({ isLoading: true, message });
        try {
            return await promise;
        } finally {
            set({ isLoading: false, message: null });
        }
    },
}));
