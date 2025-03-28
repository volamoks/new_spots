# Zustand Store Refactoring Plan

## Analysis Summary

Based on the review of store files (`lib/stores/`) and `useState` usage (`app/components/`), the following observations were made:

1.  **Booking Data (`BookingRequestWithBookings`):**
    *   Significant overlap between `bookingStore` and `manageBookingsStore` in fetching and filtering booking data.
    *   `bookingStore` is large, handling creation/updates and zone selection for creation.
    *   Creation logic (`createBooking`) is duplicated in `bookingStore`, `categoryManagerZonesStore`, and `supplierZonesStore`.

2.  **Zone Data (`Zone`):**
    *   Massive redundancy across `zonesStore`, `bookingZonesStore`, `filterStore`, and `zones/baseZonesStore` in fetching, filtering, pagination, and unique value calculation.
    *   `zones/baseZonesStore` attempts a comprehensive solution but duplicates logic from others.
    *   Role-specific stores (`dmpManagerZonesStore`, `categoryManagerZonesStore`, `supplierZonesStore`) compose functionality on top of `baseZonesStore` but inherit its complexity.

3.  **Suppliers:**
    *   Fetched in `zones/baseZonesStore` and also directly within `SupplierSelection` / `ManageSupplierSelection` components using `useState`.

4.  **Loader:**
    *   `loaderStore` is simple and effective.

5.  **Toasts:**
    *   Logic is scattered across multiple stores/utility functions within stores.

6.  **`useState` Usage:**
    *   Much usage is appropriate for local UI state (dropdowns, inputs, etc.).
    *   Potentially movable state includes supplier fetching/state, some filter states, and maybe category selection.

## Core Problems

*   **Redundancy:** Fetching the same data (zones, bookings, suppliers) multiple times. Reimplementing filtering/sorting/pagination logic. Duplicated `createBooking` actions.
*   **Lack of Single Source of Truth:** Unclear which store holds the definitive data for zones or bookings.
*   **Bloated Stores:** `bookingStore` and `zones/baseZonesStore` handle too many responsibilities.
*   **Inconsistent Patterns:** `filterStore` exists but isn't consistently used; `zones/baseZonesStore` duplicates its purpose.

## Proposed Refactoring Plan

### 1. New Store Structure

*   **`zonesStore` (Primary Zone Management):**
    *   Manages fetching raw zones (`/api/zones`).
    *   Holds state for `zones`, `selectedZoneIds`, loading/error.
    *   Holds state for `filterCriteria`, `sortCriteria`, `paginationCriteria`.
    *   Derives `filteredSortedPaginatedZones` based on criteria.
    *   Calculates `uniqueFilterValues` (cities, markets, etc.) from raw `zones`.
    *   Provides actions: `fetchZones`, `setFilterCriteria`, `setSortCriteria`, `setPaginationCriteria`, `toggleZoneSelection`, `clearSelection`, `updateZoneLocally` (for optimistic UI), `resetFilters`.
    *   *Replaces:* Old `zonesStore`, `bookingZonesStore`, `filterStore`, `zones/baseZonesStore`.

*   **`bookingRequestStore` (Primary Booking Request Management):**
    *   Manages fetching booking requests (`/api/bookings`).
    *   Holds state for `bookingRequests`, loading/error.
    *   Holds state for `filterCriteria` (status, supplier, dates, etc.).
    *   Derives `filteredBookingRequests`.
    *   Calculates `uniqueFilterValues` (suppliers, etc.) from raw `bookingRequests`.
    *   Provides actions: `fetchBookingRequests`, `setFilterCriteria`, `updateBookingRequestLocally`, `resetFilters`.
    *   *Replaces:* `manageBookingsStore` and the data/filtering parts of `bookingStore`.

*   **`bookingActionsStore` (Booking Creation/Update Logic):**
    *   Holds minimal state related to the *creation process* (`selectedZonesForCreation`, `selectedSupplierInnForCreation`, loading/error states for actions).
    *   Provides actions: `createBookingRequest` (calls API), `updateBookingStatus` (calls API), `updateRequestStatus` (calls API).
    *   These actions trigger refreshes/updates in `bookingRequestStore` or `zonesStore` on success.
    *   *Replaces:* Action logic from `bookingStore`, `categoryManagerZonesStore`, `supplierZonesStore`.

*   **`supplierStore` (Supplier Data):**
    *   Manages fetching suppliers (`/api/suppliers`).
    *   Holds state for `suppliers`, loading/error.
    *   Provides action: `fetchSuppliers`.
    *   *Replaces:* Supplier fetching in `baseZonesStore` and components.

*   **`loaderStore`:** Keep as is.

*   **Role-Specific Action Stores (e.g., `dmpManagerActionsStore`):**
    *   Contain *only* API-calling actions for that role (e.g., `bulkUpdateZoneStatus`).
    *   Do *not* hold duplicated state.
    *   Call actions on primary stores (`zonesStore`, `bookingRequestStore`) on success.
    *   Composition hooks (`useDmpManagerData`) combine primary store state + role-specific actions.

### 2. Refactoring Steps

1.  Implement `supplierStore`. Update components using suppliers.
2.  Implement the new consolidated `zonesStore`.
3.  Implement `bookingRequestStore`.
4.  Implement `bookingActionsStore`.
5.  Refactor role-specific stores (`dmpManager...`, `categoryManager...`, `supplier...`) to be action-only and use primary stores. Update composition hooks.
6.  Refactor UI components to use the new stores, removing redundant `useState` where applicable.
7.  Clean up old store files and scattered toast logic (move to UI utilities/hooks).

### 3. Mermaid Diagram of Proposed Structure

```mermaid
graph TD
    subgraph Stores
        Z[zonesStore\n(Data, Filters, Sort, Paginate, Select)]
        BR[bookingRequestStore\n(Data, Filters)]
        BA[bookingActionsStore\n(Create/Update Logic, Creation State)]
        S[supplierStore\n(Data)]
        L[loaderStore]
        RSA[roleSpecificActionsStore\n(API Calls Only)]
    end

    subgraph UI Components
        ZT[Zone Tables / Lists]
        BT[Booking Tables / Lists]
        BC[Booking Creation UI]
        BU[Booking Update UI]
        SS[Supplier Selection]
        ZF[Filter Components]
        GL[Global Loader]
        RB[Role-Specific Buttons]
    end

    subgraph API
        A_Zones[/api/zones]
        A_Bookings[/api/bookings]
        A_Suppliers[/api/suppliers]
        A_Requests[/api/requests]
        A_Role[/api/zones/bulk..., /api/zones/:id/status]
    end

    %% Data Flow
    Z -- Fetches --> A_Zones
    BR -- Fetches --> A_Bookings
    S -- Fetches --> A_Suppliers
    BA -- Calls --> A_Bookings
    BA -- Calls --> A_Requests
    RSA -- Calls --> A_Role
    RSA -- Calls --> A_Zones

    %% Store Updates on Success
    BA -- Triggers Refresh/Update --> BR
    BA -- Triggers Refresh/Update --> Z
    RSA -- Triggers Refresh/Update --> Z
    RSA -- Triggers Refresh/Update --> BR

    %% UI <-> Stores
    ZT -- Reads/Updates --> Z
    ZF -- Reads/Updates --> Z
    ZF -- Reads/Updates --> BR
    BT -- Reads --> BR
    BC -- Reads/Updates --> BA
    BC -- Reads --> Z
    BC -- Reads --> S
    BU -- Reads/Updates --> BA
    SS -- Reads --> S
    GL -- Reads --> L
    RB -- Calls --> RSA

    %% Loader Usage
    Z & BR & BA & S & RSA -- Use --> L