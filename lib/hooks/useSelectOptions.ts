'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // Re-add useRef
// import { useLoaderStore } from '@/lib/stores/loaderStore'; // Removed
import { toast } from '@/components/ui/use-toast';
import { debounce } from '@/lib/utils/debounce'; // Re-add debounce import
import { fetchWithLoading, ApiError } from '@/lib/utils/api'; // Import new utility
interface Option {
    value: string;
    label: string;
}

interface UseSelectOptionsProps<T> {
    apiUrl: string; // Base API endpoint URL
    valueField: keyof T; // Field in the API response to use as the option value
    labelField: keyof T; // Field in the API response to use as the option label
    initialFetchLimit?: number; // Optional limit for the initial fetch
    searchParam?: string; // Query parameter name for search term (default: 'search')
    limitParam?: string; // Query parameter name for limit (default: 'limit')
    debounceDelay?: number; // Debounce delay in ms (default: 300)
    loaderMessage?: string; // Message for the global loader
    errorMessage?: string; // Error message for toast notification
}

export function useSelectOptions<T>({
    apiUrl,
    valueField,
    labelField,
    initialFetchLimit, // Re-add initialFetchLimit
    searchParam = 'search',
    limitParam = 'limit',
    debounceDelay = 300, // Re-add debounceDelay
    loaderMessage = 'Загрузка данных...',
    errorMessage = 'Не удалось загрузить данные.',
}: UseSelectOptionsProps<T>) {
    const [options, setOptions] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Local loading state if needed
    const [error, setError] = useState<string | null>(null); // Local error state if needed
    // const { withLoading } = useLoaderStore(); // Removed

    const mapApiResponse = useCallback((data: T[]): Option[] => {
        return data.map(item => ({
            // Ensure value and label are strings
            value: String(item[valueField]),
            label: String(item[labelField]),
        }));
    }, [valueField, labelField]);

    const fetchData = useCallback(
        async (searchTerm: string = '', limit?: number) => {
            // --- Add check for valid apiUrl ---
            if (!apiUrl) {
                // If apiUrl is empty or null, don't fetch. Reset state.
                setOptions([]);
                setIsLoading(false);
                setError(null);
                return;
            }
            // --- End check ---

            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (searchTerm) {
                    params.set(searchParam, searchTerm);
                }
                // Only add limit if it's explicitly provided for this fetch call
                if (limit !== undefined) {
                    params.set(limitParam, String(limit));
                }
                const queryString = params.toString();
                const fullApiUrl = `${apiUrl}${queryString ? `?${queryString}` : ''}`;

                // Use fetchWithLoading instead of raw fetch + withLoading wrapper
                const data = await fetchWithLoading<T[]>(
                    fullApiUrl,
                    'GET',
                    loaderMessage // Pass the loader message
                );

                const mappedOptions = mapApiResponse(data);
                // console.log('[useSelectOptions] Fetched and mapped options:', mappedOptions); // Remove log
                setOptions(mappedOptions);
            } catch (e: unknown) {
                console.error('Failed to fetch select options:', e); // Remove prefix
                const errorMsg = e instanceof ApiError || e instanceof Error ? e.message : String(e);
                setError(errorMsg || errorMessage);
                toast({
                    title: 'Ошибка',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setOptions([]); // Clear options on error
            } finally {
                // console.log('[useSelectOptions] Fetch finished.'); // Remove log
                setIsLoading(false);
            }
        },
        [apiUrl, searchParam, limitParam, mapApiResponse, loaderMessage, errorMessage], // Removed withLoading dependency
    );

    // Initial fetch on mount
    useEffect(() => {
        // Fetch initial limited data, pass initialFetchLimit
        fetchData('', initialFetchLimit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, initialFetchLimit]); // Add initialFetchLimit dependency back

    // Debounced fetch function for search
    const debouncedFetchRef = useRef(
        debounce((...args: unknown[]) => {
            // Fetch with search term, API will apply its own limit (DEFAULT_LIMIT)
            const searchTerm = args[0];
            // Ensure the argument is a string before using it
            if (typeof searchTerm === 'string') {
                fetchData(searchTerm);
            } else {
                // Fallback if called with unexpected arguments
                fetchData('');
            }
        }, debounceDelay),
    );

    // Handler for search input changes
    const handleSearchChange = useCallback((searchTerm: string) => {
        debouncedFetchRef.current(searchTerm);
    }, []); // Ref is stable

    return {
        options,
        isLoading, // Expose local loading state
        error,     // Expose local error state
        handleSearchChange, // Re-expose search handler
    };
}