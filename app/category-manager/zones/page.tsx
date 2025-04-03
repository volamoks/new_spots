'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
// Removed useZonesStore and useBookingActionsStore imports
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import the new hook
// Removed unused FilterCriteria import
import { SimplifiedUser } from '@/lib/stores/bookingActionsStore'; // Keep SimplifiedUser type
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/lib/filterData';
import { Role } from '@prisma/client'; // Import Role type if needed for SimplifiedUser

interface SupplierOption {
    id: string;
    name: string;
    supplierName: string;
}

// Define a type for the supplier data fetched from API
interface ApiSupplier {
    id: string;
    inn?: string; // Assuming INN might be optional or part of the ID
    name: string;
}

export default function CategoryManagerZonesPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // --- Get state and actions from the consolidated hook ---
    const {
        zones,
        totalCount,
        // isLoading, // Removed unused state
        // error,     // Removed unused state
        setFilterCriteria,
        fetchFilterOptions,
        refreshZones, // Get refreshZones for initial load

        selectedZonesForCreation,
        selectedSupplierInnForCreation,
        setSelectedSupplierInnForCreation,
        createBookingRequest, // This now comes from useRoleData

        // Note: updateZoneField might also be available via useRoleData if needed
    } = useRoleData('categoryManager');

    // Fetch suppliers and categories on component mount
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/suppliers');
                if (!response.ok) {
                    throw new Error('Failed to fetch suppliers');
                }
                const data: ApiSupplier[] = await response.json(); // Type the response
                // Use INN if available, otherwise fallback to ID for the value
                setSuppliers(
                    data.map(s => ({ id: s.inn || s.id, name: s.name, supplierName: s.name })),
                );
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };

        fetchSuppliers();
        setCategories(getCategories());
        // Fetch filter options on mount as well
        fetchFilterOptions();
    }, [fetchFilterOptions]); // Added fetchFilterOptions dependency

    // Fetch initial zones (filtered by CM's category) and filter options on mount
    useEffect(() => {
        if (session) {
            refreshZones(); // Fetches initial zones based on CM's category (defined in roleActionsStore)
            fetchFilterOptions();
        }
    }, [session, refreshZones, fetchFilterOptions]); // Dependencies updated

    // Refetch zones when the selected category filter changes manually
    useEffect(() => {
        // Avoid running on initial mount if selectedCategory starts as null/undefined
        // Only run when selectedCategory actually changes *after* initial load.
        // We might need a flag or check if it's not the initial state.
        // For simplicity, let's assume setFilterCriteria handles redundant calls gracefully.
        if (session) {
            // Ensure session exists before applying filters
            console.log('Manual category filter change, applying filter criteria...');
            setFilterCriteria({
                category:
                    selectedCategory === 'ALL_CATEGORIES'
                        ? undefined // Clear category filter
                        : selectedCategory || undefined, // Apply selected or default (if any)
            }); // setFilterCriteria triggers fetchZones internally
        }
    }, [selectedCategory, session, setFilterCriteria]); // Dependency on selectedCategory

    // handleZoneSelection removed - ZonesTable/Row uses store action directly

    // Booking creation handler
    const handleCreateBooking = async () => {
        // Use .size for Set and check session user
        if (
            selectedZonesForCreation.size === 0 ||
            !selectedSupplierInnForCreation ||
            !session?.user
        )
            return;

        // Construct SimplifiedUser object from session
        const currentUser: SimplifiedUser = {
            id: session.user.id,
            role: session.user.role as Role, // Cast role if necessary
            // Add other fields if SimplifiedUser requires them
        };

        try {
            // Pass the user object to createBookingRequest
            await createBookingRequest(currentUser);
            // Add success feedback?
        } catch (error) {
            console.error('Error creating booking:', error);
            // Add error feedback?
        }
    };

    // Handler for category selection change
    const handleCategoryChange = (categoryValue: string) => {
        // Handle the "All Categories" case
        const categoryToSet = categoryValue === 'ALL_CATEGORIES' ? null : categoryValue;
        setSelectedCategory(categoryToSet);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <ZonesSummaryCard
                    totalCount={totalCount}
                    filteredCount={zones.length}
                    title="Управление зонами"
                    description="Выберите зоны для создания заявки на бронирование от имени поставщика"
                />

                {/* Supplier Selection */}
                <div className="mb-4">
                    <label
                        htmlFor="supplier-select"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Выберите поставщика:
                    </label>
                    {/* Use setSelectedSupplierInnForCreation */}
                    <Select
                        onValueChange={setSelectedSupplierInnForCreation}
                        value={selectedSupplierInnForCreation || undefined}
                    >
                        <SelectTrigger
                            id="supplier-select"
                            className="w-full md:w-1/2 lg:w-1/4"
                        >
                            <SelectValue placeholder="Выберите поставщика" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(supplier => (
                                <SelectItem
                                    key={supplier.id}
                                    value={supplier.id}
                                >
                                    {supplier.supplierName || supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Selection */}
                <div className="mb-4">
                    <label
                        htmlFor="category-select"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Выберите категорию:
                    </label>
                    <Select
                        onValueChange={handleCategoryChange}
                        value={selectedCategory || undefined}
                    >
                        <SelectTrigger
                            id="category-select"
                            className="w-full md:w-1/2 lg:w-1/4"
                        >
                            <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_CATEGORIES">Все категории</SelectItem>
                            {categories.map(category => (
                                <SelectItem
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filters and Zone Table - Rendered conditionally */}
                {/* Use selectedSupplierInnForCreation */}
                {selectedSupplierInnForCreation && (
                    <>
                        <ZonesFilters
                            role="CATEGORY_MANAGER"
                            className="mb-6"
                        />

                        <ZonesTable
                            onCreateBooking={handleCreateBooking}
                            // onZoneSelect prop removed - handled internally by ZonesTable/Row via store
                            // Pass selection state if ZonesTable needs it directly
                            // selectedZones={selectedZonesForCreation}
                            showActions={false}
                            role="CATEGORY_MANAGER"
                            selectedSupplier={selectedSupplierInnForCreation} // Pass selected supplier
                        />
                    </>
                )}
            </main>
        </div>
    );
}
