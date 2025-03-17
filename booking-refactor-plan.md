# Booking Component Refactor Plan

**Goal:** Refactor the booking component and related stores to be more modular, efficient, and handle role-based booking logic, with improved performance and code organization.

**Plan:**

1.  **Rename and Move:** Rename `app/supplier/zones-new/page.tsx` to `app/components/BookingPage.tsx` and move it to the `app/components` directory. (**DONE**)

2.  **Integrate Category Manager Functionality:**
    *   Modify `BookingPage.tsx` to conditionally render UI elements and logic based on the user's role (obtained via `useAuth` hook - see step 7).
    *   **Supplier:** Keep the existing functionality.
    *   **Category Manager:**
        *   Add a `SupplierSelection` component (integrated into the layout). This component will:
            *   Fetch suppliers using the `/api/suppliers` endpoint (modified in step 3).
            *   Display a list of suppliers (name and INN).
            *   Store the selected supplier's INN in the `bookingStore`.
        *   Add a `CategorySelection` component (integrated into the layout). This component will:
            *   Get the list of categories (from `lib/filterData.ts`).
            *   Store the selected category in the `bookingStore`.
        *   Modify the zone fetching logic to filter zones based on the selected category (if a category is selected). This will now be handled by the combination of `zonesStore` and `filterStore`.
        *   Modify the booking creation logic in `bookingStore` to include the `supplierId` (which will be the supplier's INN) when sending the request to `/api/bookings`.

3.  **Modify `/api/suppliers`:**
    *   Update `app/api/suppliers/route.ts` to include the `inn` field in the `select` clause:

        ```typescript
        // ...
        select: {
          id: true,
          name: true,
          supplierName: true,
          inn: true,
        },
        // ...
        ```

4.  **Store Refactoring:**
    *   Create a new `filterStore` (`lib/stores/filterStore.ts`) to manage all filter and sorting state. (**DONE**)
    *   Modify the existing `zonesStore` (`lib/stores/zonesStore.ts`) to only handle fetching and storing raw zone data. (**DONE**)
    *   Keep the `bookingStore` (`lib/stores/bookingStore.ts`) for managing the booking process state. (**DONE**)
    *   Create a `loaderStore` (`lib/stores/loaderStore.ts`) to manage the global loading state. (**DONE**)
    *   Remove redundant stores:
        *   `lib/stores/zones/baseZonesStore.ts` (**TODO**)
        *   `lib/stores/zones/categoryManagerZonesStore.ts`
        *   `lib/stores/zones/supplierZonesStore.ts`
        *   `lib/stores/zones/dmpManagerZonesStore.ts`
        *   `lib/store.ts`

5.  **Routing:**
    *   Create new routes:
        *   `/supplier/bookings`: For suppliers.
        *   `/category-manager/bookings`: For category managers.
    *   These routes will render the `BookingPage` component.

6.  **Refactor existing booking pages:**
    *   Replace the contents of `app/category-manager/bookings/page.tsx` and `app/supplier/bookings/page.tsx` to render the new `BookingPage` component.

7.  **`useAuth` Hook:**
    *   Create a custom hook, `useAuth` (`lib/hooks/useAuth.ts`), to encapsulate session management logic. This hook will use `useSession` internally and provide a clean API for components to access user data and authentication status.

8.  **Update `createBookingRequest`:**
    *   Update the `createBookingRequest` function in `lib/services/bookingService.ts` to use the provided `supplierId` (the INN) to associate the booking.

9.  **Custom Hooks:**
    *   Create a `useZones` hook to encapsulate fetching and filtering zones.
    *   Create a `useBooking` hook to encapsulate the booking process.
    *   Create a `useSuppliers` hook to fetch suppliers.
    *   Create a `useCategories` hook to fetch categories.

10. **Performance Enhancements:**
    *   Use `useMemo` and `useCallback` for memoization.
    *   Implement debouncing/throttling for the search input.
    *   Consider virtualization for very long lists.
    *   Optimize API calls.
    *   Utilize Next.js code splitting.

**Mermaid Diagram (Component and Store Structure):**

```mermaid
graph LR
    A[BookingPage] --> H1(useZones)
    A --> H2(useBooking)
    A --> H3(useSuppliers)
    A --> H4(useAuth)
    H1 --> Z[zonesStore]
    H1 --> F[filterStore]
    H2 --> B[bookingStore]
    Z --> DB[(Database)]
    ZonesFilters --> F
    ZonesTable --> H1

    subgraph "Zustand Stores"
        Z
        B
        F
        L[loaderStore]
    end
     subgraph "Custom Hooks"
        H1
        H2
        H3
        H4
    end
