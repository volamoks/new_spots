# Plan: Implement Brand Selection in Booking Process

**Goal:** Implement a "Brand" selection feature in the booking process, where Brands can be optionally linked to specific Suppliers via their `User.inn`. If linked, only that Supplier sees the Brand; otherwise, all Suppliers see it.

**Step-by-Step Plan:**

1.  **Update Database Schema (`prisma/schema.prisma`):**
    *   Define a new `Brand` model:
        ```prisma
        model Brand {
          id          String  @id @default(cuid())
          name        String  @unique
          supplierInn String? // Optional: Link to a specific Supplier User via their INN

          bookings Booking[]

          @@index([supplierInn]) // Index for faster filtering by INN
        }
        ```
    *   Modify the `Booking` model to add an optional `brandId` and relation:
        ```prisma
        model Booking {
          // ... other fields (id, bookingRequestId, zoneId, status, etc.)
          brandId String?
          brand   Brand?  @relation(fields: [brandId], references: [id])
          // ... other fields (createdAt, updatedAt, bookingRequest, zone)

          @@index([brandId])
        }
        ```
    *   Run the database migration: `npx prisma migrate dev --name add_brand_with_supplier_inn_link`.

2.  **Create API Endpoint to Get Brands (`GET /api/brands`):**
    *   Implement logic to:
        *   Get the logged-in user's details, specifically their `inn` (if their `role` is `SUPPLIER`).
        *   Fetch `Brand` records where `supplierInn` is `null` **OR** `supplierInn` matches the logged-in user's `inn`.
        *   Return the filtered list of Brands.

3.  **Create API Endpoint to Upload Brands (`POST /api/brands/upload`):**
    *   Implement logic to:
        *   Accept and parse the uploaded file (e.g., Excel) containing Brand names and optional Supplier INNs.
        *   For each row, create a `Brand` record. If a Supplier INN is provided in the row, store it in the `supplierInn` field of the new `Brand`. (Optional validation: check if a `User` with `role: SUPPLIER` and this `inn` exists).
        *   Return a success/error response.

4.  **Modify API Endpoint to Create Bookings (`POST /api/bookings`):**
    *   Update the route handler to accept the selected `brandId` from the frontend request.
    *   Save this `brandId` when creating the new `Booking` record.

5.  **Modify API Endpoints to Fetch Bookings (e.g., `GET /api/bookings`, `GET /api/bookings/[id]`):**
    *   Update the database queries to include the related `brand.name` via the `brandId` link when returning booking data.

6.  **Create Frontend Brand Selector Component (`BrandSelector.tsx`):**
    *   Develop a searchable dropdown component.
    *   Fetch the list of brands by calling `GET /api/brands` (backend handles filtering).
    *   Manage the state of the selected `brandId`.

7.  **Integrate Brand Selector into Booking Form (`CreateBookingPage.tsx`):**
    *   Add the `BrandSelector` component to the UI after the Category selector.
    *   Pass the selected `brandId` when submitting the booking.

8.  **Update Frontend State Management (`lib/stores/bookingRequestStore.ts`):**
    *   Add state variables for the brands list and the `selectedBrandId`.

9.  **Display Brand in Frontend Tables/Views (`BookingTable.tsx`, etc.):**
    *   Add a "Brand Name" column to booking tables.
    *   Display the Brand name in booking detail views using the data fetched in Step 5.

10. **Create Frontend Brand Upload Interface:**
    *   Develop a UI section for uploading the Brand list file.
    *   Clearly specify the file format, including the optional Supplier `INN` column.
    *   Provide user feedback on the upload process.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    subgraph Database (Prisma Schema)
        A[Define Brand Model: id, name, optional supplierInn] --> B(Add optional brandId FK to Booking Model);
        B --> C{Run Prisma Migrate};
    end

    subgraph Backend API
        D[Modify GET /api/brands] --> E(API: Fetch Brands based on user's INN + unlinked Brands);
        F[Modify POST /api/brands/upload] --> G(API: Handle Upload, incl. optional INN linking);
        H[Modify POST /api/bookings] --> I(API: Accept & Save brandId on Booking);
        J[Modify GET /api/bookings/*] --> K(API: Include Brand Name in Booking Data);
    end

    subgraph Frontend UI
        N[Create/Modify BrandSelector Component] --> O(UI: Searchable Dropdown, Fetches Filtered Brands via API);
        P[Integrate BrandSelector in CreateBookingPage] --> Q(UI: Place after Category Selector);
        R[Update State Management] --> S(State: Store selectedBrandId);
        T[Update Booking Tables/Views] --> U(UI: Display Brand Name);
    end

    subgraph Brand Management UI
        V[Create/Modify Brand Management Page/Section] --> W(UI: File Upload for Brands, specify INN link format);
    end

    C --> D; C --> F; C --> H; C --> J;
    E --> O;
    G --> W;
    I --> S;
    K --> U;
    O --> P;
    S --> P; S --> T;

    User --> P[Selects Brand];
    User --> V[Manages Brands];