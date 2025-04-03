# Zustand Stores Refactoring Plan

## Analysis Summary

Based on a review of all `*Store.ts` files within the project (`lib/stores/`, `lib/stores/zones/`, `lib/`), the following key observations were made:

1.  **Core Data Stores:** `zonesStore` and `bookingRequestStore` are central for managing zone and booking data respectively, including fetching, filtering, sorting, and pagination. `supplierStore` holds supplier reference data.
2.  **Action/Process Stores:** `bookingActionsStore` manages the state and actions specific to the *process* of creating/updating bookings.
3.  **Utility Stores:** `loaderStore` provides a useful global loading utility. `zonesManagementStore` appears to be a UI-specific helper for client-side filtering, potentially redundant.
4.  **Filter Management:** Filter criteria and options are currently managed within the stores responsible for the data (`zonesStore`, `bookingRequestStore`). A dedicated, shared filter store is deemed unnecessary at this time.
5.  **Conflicting Role Logic Patterns:** Two distinct patterns exist for handling role-specific actions:
    *   **Pattern A (`roleActionsStore.ts`):** A centralized factory pattern creating role-specific action sets, consumed via a single hook (`useRoleData`). Includes optimistic updates.
    *   **Pattern B (`zones/*` stores):** Separate minimal action stores per role, combined with primary stores via composition hooks (`useCategoryManagerData`, `useDmpManagerZones`, `useSupplierData`).
    *   **Issue:** These patterns overlap significantly, leading to duplicated action logic (API calls, state updates). Pattern A is preferred for maintainability.
6.  **Brand Data:** An API endpoint `/api/brands` exists, but currently, there's no dedicated store to fetch and hold this list. Brand selection state is handled temporarily in `bookingActionsStore`. A dedicated `brandStore` is not deemed necessary *at this time*.

## Refactoring Goals

*   Eliminate duplicated role-specific logic.
*   Centralize common API interaction patterns.
*   Improve code maintainability and readability.
*   Clarify store responsibilities.

## Refactoring Steps

1.  **Consolidate Role-Based Logic:**
    *   **Action:** Refactor `roleActionsStore.ts` to ensure it comprehensively covers all necessary actions currently handled by the `zones/categoryManagerZonesStore.ts`, `zones/dmpManagerZonesStore.ts`, and `zones/supplierZonesStore.ts` files. Ensure optimistic updates and role-specific data fetching logic (e.g., applying filters in `refreshZones`) are correctly implemented within `roleActionsStore`.
    *   **Action:** Remove the `zones/categoryManagerZonesStore.ts`, `zones/dmpManagerZonesStore.ts`, and `zones/supplierZonesStore.ts` files and their associated hooks (`useCategoryManagerData`, `useDmpManagerZones`, `useSupplierData`).
    *   **Action:** Update all UI components currently using the removed hooks to use the `useRoleData` hook exported from `lib/stores/roleActionsStore.ts` instead.

2.  **Create Shared API Utility:**
    *   **Action:** Create a reusable utility function or hook (e.g., in `lib/utils/api.ts` or a new `lib/hooks/useApi.ts`).
    *   **Functionality:** This utility should handle:
        *   Making `fetch` requests.
        *   Setting common headers (e.g., `Content-Type: application/json`).
        *   Handling base URL logic if applicable.
        *   Integrating with `useLoaderStore.getState().withLoading` to manage global loading state.
        *   Standardizing basic error handling (checking `response.ok`, parsing JSON errors).
    *   **Action:** Refactor all stores currently making direct `fetch` calls (`zonesStore`, `bookingRequestStore`, `bookingActionsStore`, `supplierStore`, `roleActionsStore`) to use this new utility.

3.  **Evaluate `zonesManagementStore`:**
    *   **Action:** Analyze the components using `zonesManagementStore`. Determine if its client-side filtering functionality is essential or if the server-side filtering provided by `zonesStore` is sufficient.
    *   **Decision:**
        *   If **redundant**, remove `zonesManagementStore.ts` and update the consuming components.
        *   If **necessary** (e.g., for instant filtering of the currently displayed page), consider moving the filtering logic directly into the component state or a local hook within that component, rather than using a global store. Remove `zonesManagementStore.ts`.

4.  **Code Cleanup & Review:**
    *   **Action:** Remove the commented-out `lib/categoryManagerStore.ts` file.
    *   **Action:** Review `zonesStore` and `bookingRequestStore` for opportunities to extract complex logic (like filter parameter construction) into utility functions in `lib/utils/` to improve readability.
    *   **Action:** Ensure consistent use of shared toast utilities (`lib/utils/toastUtils.ts`) for user feedback across all relevant actions.

## Future Considerations

*   If the need arises to display a globally accessible list of brands fetched from `/api/brands`, a simple `brandStore.ts` could be created following the pattern of `supplierStore.ts`.