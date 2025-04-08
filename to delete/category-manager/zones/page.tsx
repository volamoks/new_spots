// 'use client';

// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
// // Removed useZonesStore and useBookingActionsStore imports
// import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import the new hook
// // Removed unused FilterCriteria import
// // import { SimplifiedUser } from '@/lib/stores/bookingActionsStore'; // Removed unused import
// import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
// import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
// import { ZonesTable } from '@/app/components/zones/ZonesTable';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { getCategories } from '@/lib/filterData';
// // import { Role } from '@prisma/client'; // Removed unused import

// interface SupplierOption {
//     id: string;
//     name: string;
//     supplierName: string;
// }

// // Define a type for the supplier data fetched from API
// interface ApiSupplier {
//     id: string;
//     inn?: string; // Assuming INN might be optional or part of the ID
//     name: string;
// }

// export default function CategoryManagerZonesPage() {
//     const { data: session } = useSession();
//     const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
//     const [categories, setCategories] = useState<string[]>([]);
//     const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

//     // --- Get state and actions from the consolidated hook ---
//     const {
//         // zones, // Removed unused state
//         // totalCount, // Removed unused state
//         // isLoading, // Removed unused state
//         // error,     // Removed unused state
//         setFilterCriteria,
//         fetchFilterOptions,
//         refreshZones, // Get refreshZones for initial load

//         // selectedZonesForCreation, // Removed unused variable
//         selectedSupplierInnForCreation,
//         setSelectedSupplierInnForCreation,
//         // createBookingRequest, // Removed unused variable

//         // Note: updateZoneField might also be available via useRoleData if needed
//     } = useRoleData('categoryManager');

//     // Fetch suppliers and categories on component mount
//     useEffect(() => {
//         const fetchSuppliers = async () => {
//             try {
//                 const response = await fetch('/api/suppliers');
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch suppliers');
//                 }
//                 const data: ApiSupplier[] = await response.json(); // Type the response
//                 // Use INN if available, otherwise fallback to ID for the value
//                 setSuppliers(
//                     data.map(s => ({ id: s.inn || s.id, name: s.name, supplierName: s.name })),
//                 );
//             } catch (error) {
//                 console.error('Error fetching suppliers:', error);
//             }
//         };

//         fetchSuppliers();
//         setCategories(getCategories());
//         // Fetch filter options on mount as well
//         fetchFilterOptions();
//     }, [fetchFilterOptions]); // Added fetchFilterOptions dependency

//     // Fetch initial zones (filtered by CM's category) and filter options on mount
//     useEffect(() => {
//         if (session) {
//             refreshZones(); // Fetches initial zones based on CM's category (defined in roleActionsStore)
//             fetchFilterOptions();
//         }
//     }, [session, refreshZones, fetchFilterOptions]); // Dependencies updated

//     // Refetch zones when the selected category filter changes manually
//     useEffect(() => {
//         if (session) {
//             // Ensure session exists before applying filters
//             console.log('Manual category filter change, applying filter criteria...');
//             setFilterCriteria({
//                 category:
//                     selectedCategory === 'ALL_CATEGORIES'
//                         ? undefined // Clear category filter
//                         : selectedCategory || undefined, // Apply selected or default (if any)
//             }); // setFilterCriteria triggers fetchZones internally
//         }
//     }, [selectedCategory, session, setFilterCriteria]); // Dependency on selectedCategory

//     const handleCategoryChange = (categoryValue: string) => {
//         const categoryToSet = categoryValue === 'ALL_CATEGORIES' ? null : categoryValue;
//         setSelectedCategory(categoryToSet);
//     };

//     return (
//         <div className="min-h-screen flex flex-col bg-gray-50">
//             <main className="flex-grow container mx-auto px-4 py-8">
//                 {/* ZonesSummaryCard now takes no props */}
//                 <ZonesSummaryCard />

//                 {/* Supplier Selection */}
//                 <div className="mb-4">
//                     <label
//                         htmlFor="supplier-select"
//                         className="block text-sm font-medium text-gray-700"
//                     >
//                         Выберите поставщика:
//                     </label>
//                     {/* Use setSelectedSupplierInnForCreation */}
//                     <Select
//                         onValueChange={setSelectedSupplierInnForCreation}
//                         value={selectedSupplierInnForCreation || undefined}
//                     >
//                         <SelectTrigger
//                             id="supplier-select"
//                             className="w-full md:w-1/2 lg:w-1/4"
//                         >
//                             <SelectValue placeholder="Выберите поставщика" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {suppliers.map(supplier => (
//                                 <SelectItem
//                                     key={supplier.id}
//                                     value={supplier.id}
//                                 >
//                                     {supplier.supplierName || supplier.name}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                 </div>

//                 {/* Category Selection */}
//                 <div className="mb-4">
//                     <label
//                         htmlFor="category-select"
//                         className="block text-sm font-medium text-gray-700"
//                     >
//                         Выберите категорию:
//                     </label>
//                     <Select
//                         onValueChange={handleCategoryChange}
//                         value={selectedCategory || undefined}
//                     >
//                         <SelectTrigger
//                             id="category-select"
//                             className="w-full md:w-1/2 lg:w-1/4"
//                         >
//                             <SelectValue placeholder="Выберите категорию" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="ALL_CATEGORIES">Все категории</SelectItem>
//                             {categories.map(category => (
//                                 <SelectItem
//                                     key={category}
//                                     value={category}
//                                 >
//                                     {category}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                 </div>

//                 {/* Filters and Zone Table - Rendered conditionally */}
//                 {/* Use selectedSupplierInnForCreation */}
//                 {selectedSupplierInnForCreation && (
//                     <>
//                         <ZonesFilters />

//                         {/* ZonesTable now takes no props */}
//                         <ZonesTable />
//                     </>
//                 )}
//             </main>
//         </div>
//     );
// }
