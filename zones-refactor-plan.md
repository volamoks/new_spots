## Plan for Refactoring Zone and Filter Management for Booking Creation

**Problem:**

- Inconsistent Store Usage: Current implementation accesses different stores for filtering and fetching zones, causing confusion.
- Single Store for Multiple Functionalities:  `zonesStore` is used for both filtering and fetching zones, overloading it.
- Front-end Filtering: Filtering is desired on the front-end within the store, rather than repeated database calls.

**Goals:**

- Separate Stores: Create distinct stores for booking creation and booking management.
- Dedicated Zones Store: Have a specific store to manage zones for booking creation, fetched after category selection.
- Front-end Filtering in Store: Implement filtering of zones directly within the new store.
- Improved Data Flow: Streamline fetching, storing, and displaying zones for booking creation.

**Phase 1: Create a new `bookingZonesStore`**

1. **Create `lib/stores/bookingZonesStore.ts`:** This new store will be specifically for managing zones in the booking creation context.
2. **Move relevant logic from `zonesStore`:**
    - Move the `fetchZones` function (or a modified version) to `bookingZonesStore`.
    - Keep the unique value calculation logic (`calculateUniqueValues`) in `zonesStore` or move it to a utility function if needed only in `bookingZonesStore`.
    - Initially, `fetchZones` in `bookingZonesStore` will fetch zones based on the selected category.
3. **Implement filtering in `bookingZonesStore`:**
    - Move the filtering logic from `filterStore.applyFilters` and `CreateBookingPage`'s `filteredByCategory` to `bookingZonesStore`.
    - The store will manage its own filter state (city, market, macrozone, equipment, search term).
    - Create actions in `bookingZonesStore` to set and update these filters.
    - Modify `fetchZones` to apply these filters on the **frontend** after fetching all zones for a category.
4. **Update `CreateBookingPage`:**
    - Replace `useZonesStore` and `useFilterStore` in `CreateBookingPage` with `useBookingZonesStore`.
    - Update `ZonesTable` to receive zones from `useBookingZonesStore`.
    - Update `BookingFilters` to use actions from `useBookingZonesStore` to update filters instead of `filterStore`.
    - Remove the `filteredZones` and `filteredByCategory` memoized variables from `CreateBookingPage`.
    - Modify `ZonePagination` to use the total number of zones from `bookingZonesStore`.

**Phase 2: Database Query Optimization (Optional, Future Improvement)**

1. **Backend Filtering:** In the future, consider optimizing the backend API (`/api/zones`) to handle filtering parameters.
2. **Modify `fetchZones` (Backend):** Update the backend `fetchZones` API to accept query parameters for city, market, macrozone, equipment, and search term.
3. **Update `fetchZones` (Frontend):** Modify the `fetchZones` function in `bookingZonesStore` to pass the filter parameters to the backend API.

**Mermaid Diagram - Component and Store Interaction (Phase 1):**

```mermaid
graph LR
    CreateBookingPage --> CategorySelection
    CreateBookingPage --> BookingFilters
    CreateBookingPage --> ZonesTable
    CreateBookingPage --> ZonePagination

    CategorySelection --> CreateBookingPage: setSelectedCategoryCallback
    BookingFilters --> bookingZonesStore: (filter actions)
    ZonesTable --> bookingZonesStore: useBookingZonesStore.zones
    ZonePagination --> bookingZonesStore: useBookingZonesStore.zones (for total count)

    CreateBookingPage -- uses --> bookingZonesStore: useBookingZonesStore
    BookingFilters -- uses --> bookingZonesStore: useBookingZonesStore
    ZonesTable -- uses --> bookingZonesStore: useBookingZonesStore
    ZonePagination -- uses --> bookingZonesStore: useBookingZonesStore

    style CreateBookingPage fill:#f9f,stroke:#333,stroke-width:2px
    style bookingZonesStore fill:#ccf,stroke:#333,stroke-width:2px