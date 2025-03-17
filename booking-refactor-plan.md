# Booking System Refactor Plan

This document outlines the plan to address issues with the booking creation process and implement new features.

## Root Cause Analysis

The primary issue is the hardcoded `userId` and `userRole` in the `createBooking` function within `lib/stores/bookingStore.ts`. This results in all bookings being created under the same user and role, regardless of the logged-in user.

## Additional Issues and Requirements

*   **Brand Input:** A "brand" field needs to be added to the booking process.
*   **Workflow:** The booking workflow differs based on user role (Supplier vs. Category Manager):
    *   Supplier-created bookings require Category Manager approval (`PENDING_KM`).
    *   Category Manager-created bookings go directly to DMP Manager approval (`PENDING_DMP`).
*   **DMP Manager Approval:** After DMP Manager approval, the database needs to be updated (status, supplier, and brand).
*   **Error Handling:** The current error handling is insufficient and needs improvement.
*   **Transactionality:** The booking creation process should be atomic (all steps succeed or fail together).

## Plan

### 1. Fix Hardcoded User and Role (Critical)

*   In `lib/stores/bookingStore.ts`, remove the hardcoded `userId` and `userRole` from the `createBooking` function.
*   Use the `useAuth` hook to get the currently logged-in user's ID and role.
*   Pass the correct `userId`, `userRole`, `userCategory` (if applicable), and `supplierInn` (if applicable) to the `createBookingRequest` function.

### 2. Implement Brand Input

*   Add a `brand` field to the `Zone` model in `prisma/schema.prisma`.
*   Create and apply a database migration: `npx prisma migrate dev --name add_brand_to_zone`.
*   Add a `brand` field to the `BookingState` interface in `lib/stores/bookingStore.ts`.
*   Add state management for the `brand` in `lib/stores/bookingStore.ts`.
*   Modify the `createBookingRequest` function in `lib/services/bookingService.ts` to accept a `brand` parameter.
*   Modify the `createBooking` function in `lib/data/bookings.ts` to accept and use the `brand` parameter.
*   Add a text input field for the brand in `app/components/booking/BookingActions.tsx`.
*   Update calls to `createBooking` to pass the brand.

### 3. Adjust Booking Status Logic

*   In `lib/services/bookingService.ts`, in the `createBookingRequest` function, set the initial `booking` status based on the user's role:
    *   Supplier: `PENDING_KM`
    *   Category Manager: `PENDING_DMP`

### 4. DMP Manager Approval Updates

*   Confirm that the `updateBookingStatus` function correctly handles status updates and that the brand and supplier are correctly set during booking creation and approval.

### 5. Improve Error Handling

*   Use the `useToast` hook in `BookingActions.tsx` to display user-friendly error messages.
*   Add more specific error handling in `createBookingRequest` and `createBooking` as needed.

### 6. Review Transactionality

*   Wrap the booking creation logic in `lib/services/bookingService.ts` within a Prisma transaction.
*   Modify `createBooking` function in `lib/data/bookings.ts` to accept a prisma instance.

### 7. Test Thoroughly

*   Perform thorough testing with different user roles (supplier, category manager, DMP manager) and different scenarios.

## Mermaid Diagram

```mermaid
graph LR
    A[User clicks "Create Booking"] --> B(BookingActions.handleCreateBooking);
    B --> BA[Get Brand Input];
    B --> C{useBookingStore.createBooking};
    C --> D[Get User ID and Role from useAuth];
    D --> E(lib/services/bookingService.ts: createBookingRequest);
    E --> EA[Pass Brand to createBookingRequest];
    E --> F{Check Zone Availability};
    F -- Available --> G(lib/data/bookings.ts: createBooking);
    G --> GA[Include Brand in Booking Record];
    F -- Unavailable --> H[Throw Error];
    G --> I[Update Zone Status to BOOKED];
    I --> J[Create Booking Request Record];
    C -- Error --> K[Display Error Toast];
    C -- Success --> L[Clear Selected Zones];
    style D fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
