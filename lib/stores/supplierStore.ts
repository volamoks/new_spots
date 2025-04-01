import { create } from 'zustand';

// Define a supplier type (can be refined based on actual API response)
export interface Supplier {
    id: string; // Assuming API returns an ID
    inn: string;
    name: string;
    // Add other relevant fields if needed
}

interface SupplierState {
    suppliers: Supplier[];
    isLoading: boolean;
    error: string | null;
    fetchSuppliers: () => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set) => ({
    suppliers: [],
    isLoading: false,
    error: null,

    fetchSuppliers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/suppliers');
            if (!response.ok) {
                let errorMsg = 'Failed to fetch suppliers';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMsg);
            }
            const data: Supplier[] = await response.json();
            // console.log('Fetched suppliers data:', data); // <-- REMOVE THIS LINE
            set({ suppliers: data, isLoading: false });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error("Error fetching suppliers:", errorMessage);
            set({ error: errorMessage, isLoading: false, suppliers: [] });
        }
    },
}));