'use client';

// Removed useState as pagination is now in store
import { ZoneStatus, ZoneKeys } from '@/types/zone'; // Removed unused Zone import
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ZonePagination } from './ZonePagination';
import { ZonesTableHeader } from './ZonesTableHeader';
import { ZonesTableRow } from './ZonesTableRow';
import { ZoneSelectionActionsPanel } from './ZoneSelectionActionsPanel';
// Import the appropriate composition hook (using DMP as default/example)
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Correct hook name
// import { useCategoryManagerData } from '@/lib/stores/zones/categoryManagerZonesStore';
// import { useSupplierData } from '@/lib/stores/zones/supplierZonesStore';
import { useEffect } from 'react'; // Import useEffect for potential initial fetch

// --- Simplified Props ---
interface ZonesTableProps {
    // Actions/Data potentially coming from parent context, not the base store
    onCreateBooking?: (zoneIds: string[]) => Promise<void>;
    onStatusChange?: (zoneId: string, newStatus: ZoneStatus) => Promise<void>; // Example: API call wrapper
    onUpdateZoneField?: (
        zoneId: string,
        field: 'supplier' | 'brand',
        value: string | null,
    ) => Promise<void>; // Example: API call wrapper
    onSelectSupplier?: (supplierId: string) => void; // If needed for booking context
    selectedSupplier?: string | null; // If needed for booking context

    // Configuration props
    showActions?: boolean; // Controls if status actions column is shown
    role?: string; // Role might still be needed for conditional UI not covered by store logic
    className?: string;
    // initialFetchRole?: string; // Removed unused prop
}

export function ZonesTable({
    // Keep external action handlers and config
    onCreateBooking,
    onStatusChange,
    onUpdateZoneField,
    onSelectSupplier,
    selectedSupplier,
    // Config props
    showActions = true,
    role = 'DMP_MANAGER',
    className = '',
}: // initialFetchRole, // Removed unused prop
ZonesTableProps) {
    // --- Get State and Actions from Store ---
    // Use the composition hook (adjust based on actual usage context if needed)
    const {
        zones, // Holds the zones for the CURRENT page now
        // paginatedZones, // Removed - use 'zones' directly
        selectedZoneIds, // Now a Set<string>
        sortCriteria, // Contains field and direction
        paginationCriteria, // Contains currentPage and itemsPerPage
        isLoading,
        uniqueFilterValues, // Contains unique suppliers, etc.
        totalCount, // Use totalCount from the refactored store
        error, // Handle potential errors

        // Actions from zonesStore (via hook)
        fetchZones,
        toggleZoneSelection,
        setSortCriteria,
        toggleSelectAll,
        setPaginationCriteria,

        // Actions from dmpManagerActionsStore (via hook)
        // updateZoneField, // This is passed as a prop, no need to get from hook here
        // Other DMP actions if needed by the table directly
    } = useDmpManagerZones(); // Use the correct hook

    // Destructure further for convenience
    const { field: sortField, direction: sortDirection } = sortCriteria;
    const { currentPage, itemsPerPage } = paginationCriteria;
    // Assuming uniqueSuppliersFromDB might still be needed for editable cell, get from store if available
    const { suppliers: uniqueSuppliers } = uniqueFilterValues; // Destructure suppliers for panel
    // TODO: Need to clarify source for uniqueSuppliersFromDB if still needed

    // --- Role-based UI logic ---
    const isDmpManager = role === 'DMP_MANAGER';
    const isSupplier = role === 'SUPPLIER';
    const isCategoryManager = role === 'CATEGORY_MANAGER';

    const showSelectionColumn = isSupplier || isCategoryManager || isDmpManager;
    const showStatusActions = (isSupplier || isCategoryManager) && showActions;

    // --- Fetch initial data (optional, depends on where fetch is usually triggered) ---
    useEffect(() => {
        // Example: Fetch zones when the component mounts if not already loaded
        // Adjust the condition based on your app's data loading strategy
        if (zones.length === 0 && !isLoading) {
            // fetchZones now takes no arguments
            fetchZones();
        }
        // Add dependencies if needed, e.g., [fetchZones, zones.length, isLoading]
    }, [fetchZones, zones.length, isLoading]); // Updated dependencies

    // --- Pagination Logic (using store state) ---
    const totalItems = totalCount; // Use totalCount from store
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    // 'zones' from the store now holds the current page's data
    // const currentZonesOnPage = paginatedZones; // Removed this line

    // --- Handlers ---
    // Handler for creating booking (still needs external prop)
    const handleCreateBooking = async () => {
        if (onCreateBooking && selectedZoneIds.size > 0) {
            // Use .size for Set
            await onCreateBooking(Array.from(selectedZoneIds)); // Convert Set to Array
        }
    };

    // Select All handler (uses store action)
    const handleSelectAll = (checked: boolean) => {
        // toggleSelectAll action in store now only needs the boolean state
        toggleSelectAll(checked);
    };

    // Check if all zones on the current page are selected (uses store state)
    const areAllCurrentZonesSelected =
        zones.length > 0 && // Use 'zones'
        zones.every(zone => selectedZoneIds.has(zone.id)); // Use .has() for Set

    // --- Calculate ColSpan for Empty State ---
    // Base columns: ID, City, Market, Macrozone, Equipment, Supplier, Brand, Status = 8
    let colSpan = 8;
    if (showSelectionColumn) colSpan++;
    if (showStatusActions) colSpan++;
    // Note: Supplier/Brand are always shown now based on header, adjust if needed

    // --- Render ---
    if (error) {
        return <div className="text-red-500 p-4">Ошибка загрузки зон: {error}</div>;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Render the selection actions panel (only shown for Supplier/Category Manager) */}
            {showSelectionColumn && !isDmpManager && onCreateBooking && (
                <ZoneSelectionActionsPanel
                    selectedZonesCount={selectedZoneIds.size} // Use .size for Set
                    isSupplier={isSupplier}
                    isCategoryManager={isCategoryManager}
                    selectedSupplier={selectedSupplier ?? null} // Provide default null
                    uniqueSuppliers={uniqueSuppliers} // From store (filtered data)
                    onSelectSupplier={onSelectSupplier} // Prop from parent context
                    onCreateBooking={handleCreateBooking} // Local handler using prop
                    isLoading={isLoading} // From store
                />
            )}

            <div className="rounded-md border">
                <Table>
                    {/* Render the Table Header (pass store state/actions) */}
                    <ZonesTableHeader
                        showSelectionColumn={showSelectionColumn}
                        areAllCurrentZonesSelected={areAllCurrentZonesSelected} // Calculated from store state
                        onSelectAll={handleSelectAll} // Local handler using store action
                        sortField={sortField as ZoneKeys | null} // From store (cast needed)
                        sortDirection={sortDirection} // From store
                        onSortChange={(field, direction) => {
                            // Wrap setSortCriteria
                            setSortCriteria({ field, direction });
                        }}
                        showStatusActions={showStatusActions}
                        disableSelectAll={zones.length === 0} // Use zones
                    />
                    <TableBody>
                        {isLoading && zones.length === 0 ? ( // Show loading indicator, use zones
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-center py-4 text-gray-500"
                                >
                                    Загрузка зон...
                                </TableCell>
                            </TableRow>
                        ) : zones.length > 0 ? ( // Use zones
                            zones.map(
                                (
                                    zone, // Use zones
                                ) => (
                                    // Render Table Row (pass store state/actions and external handlers)
                                    <ZonesTableRow
                                        key={zone.id}
                                        zone={zone}
                                        isSelected={selectedZoneIds.has(zone.id)} // Use .has() for Set
                                        showSelectionColumn={showSelectionColumn}
                                        onZoneSelect={toggleZoneSelection} // Store action
                                        isDmpManager={isDmpManager}
                                        showStatusActions={showStatusActions}
                                        onStatusChange={onStatusChange} // Prop from parent
                                        onUpdateZoneField={onUpdateZoneField} // Prop from parent
                                        // uniqueSuppliersFromDB prop removed - ZonesTableRow should fetch if needed
                                        isLoading={isLoading} // From store
                                    />
                                ),
                            )
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-center py-4 text-gray-500"
                                >
                                    {zones.length === 0 && !isLoading // Check original zones length
                                        ? 'Зоны не найдены'
                                        : 'Нет зон, соответствующих фильтрам'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Render Pagination (pass store state/actions) */}
            <ZonePagination
                currentPage={currentPage} // From store
                totalPages={totalPages} // Calculated from store state
                onPageChange={page => setPaginationCriteria({ currentPage: page })} // Use setPaginationCriteria
                itemsPerPage={itemsPerPage} // From store
                onItemsPerPageChange={count => setPaginationCriteria({ itemsPerPage: count })} // Use setPaginationCriteria
                totalItems={totalItems} // Calculated from store state
                filteredItems={totalItems} // Pass the total filtered count
                isDisabled={isLoading} // From store
            />
        </div>
    );
}
