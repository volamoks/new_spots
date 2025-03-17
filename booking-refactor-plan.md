# Booking Request Management Refactor Plan

## 1. Overview

The goal is to implement a system where different user roles (supplier, KM, DMP manager) can view and manage booking requests.

*   **Supplier:** Needs to see their booking requests, grouped by `bookingRequest` within `booking`.
*   **KM (Category Manager):** Needs to see booking requests to confirm them.
*   **DMP Manager:** Needs to approve booking requests after KM approval.
*   **Database Update:** After DMP Manager approval, the `zone` table in the database needs to be updated with the supplier and status.
*   **Existing `bookingStore`:** Leverage the existing `bookingStore`.
*   **Statuses:** Use existing statuses defined in an enum.

## 2. Statuses

The `BookingStatus` enum should include `PENDING_KM`, `KM_APPROVED`, `KM_REJECTED`, `DMP_APPROVED`, and `DMP_REJECTED`.

## 3. Component Breakdown

*   **`BookingFilters.tsx`:** This component should handle filtering booking requests based on various criteria (e.g., status, supplier, date range).
*   **`BookingTable.tsx`:** This component should be responsible for displaying the booking requests in a table format. It should receive the filtered booking data as a prop.
*   **`BookingActions.tsx`:** This component should handle the approve/reject actions for KM and DMP managers. It should receive the booking request and zone IDs as props, as well as the `onApprove` and `onReject` functions.
*   **`RequestsTable.tsx`:** This component will act as the parent component, fetching data from the `bookingStore`, applying filters, and passing data to the child components.

## 4. Implementation Steps

1.  **Authentication:** Ensure that the user's role is correctly identified using `lib/auth.ts`.
2.  **Data Fetching:**
    *   Modify the `/api/bookings` endpoint to filter booking requests based on the user's role.
    *   For suppliers, group the booking requests as needed.
    *   For KM and DMP managers, fetch only the booking requests that require their approval.
    *   Leverage the existing `bookingStore` to manage the booking data.
3.  **UI Updates:**
    *   Create a universal UI component with filters, a table, and actions.
    *   Use this component to create separate views for suppliers, KM, and DMP managers.
    *   Display the booking requests in a table or list format, with appropriate filtering and sorting options.
    *   Implement approval/rejection actions for KM and DMP managers.
4.  **Database Update:**
    *   Modify the `/api/bookings/[id]` endpoint to handle KM approval/rejection and DMP manager approval/rejection.
    *   Update the `booking.status` to `KM_APPROVED`, `KM_REJECTED`, `DMP_APPROVED`, or `DMP_REJECTED` accordingly.
    *   After DMP manager approval, update the `zone` table with the supplier and status.
5.  **`createBookingRequest` Update:**
    *   Modify the `createBookingRequest` function to assign the supplier to the `zone` in `createBookingRequest` for CATEGORY\_MANAGER.
    *   Modify the `createBookingRequest` function to NOT update the `zone.status` immediately after the booking is created.
6.  **Error Handling:** Implement proper error handling and display appropriate messages to the user.

## 5. API Endpoints

*   `/api/bookings`: Fetch booking requests (filtered by role).
*   `/api/bookings/[id]`: Update booking status (KM/DMP approval/rejection).
*   `/api/zones/[id]`: Update zone table (after DMP approval).

## 6. `bookingStore` Updates

*   Modify the `fetchBookings` function to filter booking requests based on the user's role.
*   Add functions to handle KM and DMP manager approvals/rejections, calling the appropriate API endpoints.

## 7. Component Diagram

```mermaid
graph LR
    A[RequestsTable.tsx] --> B{BookingFilters.tsx};
    A --> C{BookingTable.tsx};
    A --> D{BookingActions.tsx};
    C --> E{StatusBadge.tsx};
    B --> F{useBookingStore};
    C --> F;
    D --> F;
    F --> G[API Endpoints (/api/bookings, /api/zones)];
    G --> H{Database};
