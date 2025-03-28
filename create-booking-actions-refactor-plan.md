# Refactoring Plan for `CreateBookingActions.tsx`

This plan details the steps required to refactor the `app/components/booking/CreateBookingActions.tsx` component to utilize the new centralized `useBookingActionsStore` and `useZonesStore`, aligning with the overall store refactoring strategy.

## Refactoring Steps

1.  **Update Imports:**
    *   Remove: `useBookingStore`, `useBookingZonesStore`, `useLoader`.
    *   Add: `useBookingActionsStore`, `useZonesStore`.
2.  **Update Store Hook Usage:**
    *   Replace `useBookingStore()` with `useBookingActionsStore()`. Get:
        *   `selectedZonesForCreation`
        *   `selectedSupplierInnForCreation`
        *   `isCreating`
        *   `createError`
        *   `createBookingRequest`
        *   `clearSelectedZonesForCreation`
    *   Replace `useBookingZonesStore()` with `useZonesStore()`. Get:
        *   `fetchZones` (or equivalent refresh action)
        *   `isLoading` (or equivalent loading state)
3.  **Refactor `handleCreateBooking`:**
    *   Remove manual loading control (`setLoading`).
    *   Keep `session.user` retrieval and conversion.
    *   Remove logic determining `supplierInnToUse`.
    *   Replace `createBooking(...)` call with `createBookingRequest(simplifiedUser)`.
    *   Remove manual `clearSelectedZones()` call.
    *   Consider adding UI feedback based on the result or `createError`.
4.  **Refactor `handleRefresh`:**
    *   Remove manual loading control (`setLoading`).
    *   Replace `refreshZones()` call with `fetchZones()` (or equivalent).
5.  **Update JSX:**
    *   Change `selectedZones.length` to `selectedZonesForCreation.size`.
    *   Update `disabled` prop for "Создать бронирование" button: `disabled={isLoading || isCreating || selectedZonesForCreation.size === 0}`.
    *   Update `disabled` prop for "Обновить" button: `disabled={isLoading || isCreating}`.
    *   Optionally, display `createError`.
6.  **Cleanup:** Remove unused variables and imports.

## Mermaid Diagram (Component Interaction)

```mermaid
graph LR
    subgraph Component [CreateBookingActions.tsx]
        direction LR
        UI_CreateBtn[Button: Создать бронирование]
        UI_RefreshBtn[Button: Обновить]
        UI_Count[Display: Count(selectedZonesForCreation.size)]
        UI_Error[Display: createError?]
    end

    subgraph Stores
        BAS[useBookingActionsStore]
        ZS[useZonesStore]
        Auth[useSession]
    end

    %% Interactions
    UI_CreateBtn -- onClick --> H_Create[handleCreateBooking]
    UI_RefreshBtn -- onClick --> H_Refresh[handleRefresh]

    H_Create -- Reads --> Auth
    H_Create -- Calls --> BAS_Action(BAS.createBookingRequest)

    H_Refresh -- Calls --> ZS_Action(ZS.fetchZones)

    Component -- Reads State --> BAS_State(BAS: selectedZonesForCreation, isCreating, createError)
    Component -- Reads State --> ZS_State(ZS: isLoading)