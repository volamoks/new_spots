'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useZonesStore, FilterCriteria } from '@/lib/stores/zonesStore';
import { useBookingActionsStore, SimplifiedUser } from '@/lib/stores/bookingActionsStore'; // Correct store
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

    // --- Get state and actions from the refactored zones store ---
    const { zones, totalCount, setFilterCriteria, fetchFilterOptions } = useZonesStore(); // Added fetchFilterOptions

    // --- Get state and actions from booking actions store ---
    const {
        selectedZonesForCreation,
        selectedSupplierInnForCreation,
        // addSelectedZoneForCreation, // Removed - Handled by ZonesTable/Row internally
        // removeSelectedZoneForCreation, // Removed - Handled by ZonesTable/Row internally
        setSelectedSupplierInnForCreation,
        createBookingRequest,
    } = useBookingActionsStore(); // Use the correct hook

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

    // Fetch zones when session loads or selectedCategory changes
    useEffect(() => {
        if (session) {
            console.log('Applying category filter and fetching zones for category manager');
            setFilterCriteria({
                category:
                    selectedCategory === 'ALL_CATEGORIES'
                        ? undefined
                        : selectedCategory || undefined,
            } as Partial<FilterCriteria>);
        }
    }, [session, selectedCategory, setFilterCriteria]);

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
