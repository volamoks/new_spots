// Define the type for the returned debounced function, including the cancel method
interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
    cancel(): void;
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null;

    const debounced: DebouncedFunction<T> = (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };

    // Add the cancel method to the debounced function
    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}
