// Define the expected shape of the toast function argument more robustly
// This should match the actual signature provided by useToast
// Removed unused useToast import
type ToastFunction = (options: {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  // Add other potential options from shadcn/ui toast if needed
}) => void;

// Define the expected shape of the object returned by useToast
export interface UseToastReturn { // Added export
  toast: ToastFunction;
  // Add dismiss etc. if needed
}

/**
 * Creates a success toast function.
 * @param toast - The toast object from useToast().
 * @returns A function to show a success toast.
 */
export const createSuccessToast = (toast: UseToastReturn) => (title: string, description: string) => {
  toast.toast({ title, description });
};

/**
 * Creates an error toast function.
 * @param toast - The toast object from useToast().
 * @returns A function to show an error toast.
 */
export const createErrorToast = (toast: UseToastReturn) => (title: string, description: string) => {
  toast.toast({ title, description, variant: "destructive" });
};

// Potentially add more shared toast utilities here if needed