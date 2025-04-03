import { create } from 'zustand';
// Remove useLoaderStore import
// import { useLoaderStore } from './loaderStore';
// Import the new utility and ApiError
import { fetchWithLoading, ApiError } from '@/lib/utils/api'; // Adjust path if necessary
// Import toast function
import { toast } from '@/components/ui/use-toast';

// Define a supplier type (can be refined based on actual API response)
export interface Supplier {
    id: string; // Assuming API returns an ID
    inn: string;
    name: string;
    // Add other relevant fields if needed
}

interface SupplierState {
    suppliers: Supplier[];
    isLoading: boolean; // Keep for potential direct use, though global loader handles UI
    error: string | null;
    fetchSuppliers: () => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set) => ({
    suppliers: [],
    isLoading: false, // Initial state
    error: null,

    fetchSuppliers: async () => {
        // Set loading state locally (optional, as fetchWithLoading handles global)
        set({ isLoading: true, error: null });

        try {
            // Use the new fetchWithLoading utility
            const data = await fetchWithLoading<Supplier[]>(
                '/api/suppliers',
                'GET',
                'Загрузка поставщиков...'
            );

            const uniqueSuppliers = Array.from(new Map(data.map(supplier => [supplier.inn.trim(), supplier])).values()); // Trim INN for de-duplication

            set({ suppliers: uniqueSuppliers, isLoading: false, error: null }); // Set unique suppliers and reset loading/error

        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred';
            if (error instanceof ApiError || error instanceof Error) {
                errorMessage = error.message;
            }
            console.error("Error fetching suppliers:", errorMessage);
            // Set local error state and ensure suppliers are cleared on error
            set({ error: errorMessage, isLoading: false, suppliers: [] });
            // Add error toast
            toast({
                title: 'Ошибка загрузки поставщиков',
                description: errorMessage,
                variant: 'destructive',
            });

        }
    },
}));