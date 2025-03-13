## Plan: Fetch Zones by Macrozone and Update Store

**Objective:** Modify the application to fetch zones from the database based on selected macrozones and update the `zonesStore` with the fetched data.

**Steps:**

1.  **Create a new data fetching function:**
    *   Create a new file `lib/data/zones.ts`.
    *   In `lib/data/zones.ts`, define a function `getZonesByMacrozones(macrozones: string[])` that fetches zones from the database using Prisma.
    *   This function will query the `Zone` table and filter zones where `mainMacrozone` is in the provided `macrozones` array.
    *   The function should return an array of `Zone` objects.

2.  **Update `zonesStore` (`lib/zonesStore.ts`):**
    *   In `lib/zonesStore.ts`, modify the `setZones` action to accept an optional `macrozones` parameter.
    *   If `macrozones` is provided, call `getZonesByMacrozones(macrozones)` to fetch data from the database.
    *   If `macrozones` is not provided (or empty), fetch all zones as it's currently doing (or decide to not fetch anything initially and only fetch when macrozones are selected).
    *   Update the store's `zones` and `filteredZones` state with the fetched data.

3.  **Modify `Filters` component (`app/components/Filters.tsx`):**
    *   Locate the `useEffect` hook (lines 24-28) that currently calls `fetchZonesFromDB()` when `filters.macrozone` changes.
    *   **Remove** the existing `fetchZonesFromDB()` call from this `useEffect`.
    *   Instead, when macrozones are selected in "Step 2", update the `zonesStore` by dispatching the `setZones` action with the selected `adjacentMacrozones` (which correspond to `mainMacrozones` in the database, as clarified by the user).

4.  **Implement `fetchZonesFromDB` in `zonesStore`:**
    *   In `lib/zonesStore.ts`, implement the `fetchZonesFromDB` action.
    *   This action will:
        *   Get the selected `macrozoneFilters` from the store's state.
        *   Call `getZonesByMacrozones(macrozoneFilters)` to fetch zones from the database based on the selected macrozones.
        *   Update the `zones` state in the store with the fetched data.

5.  **Filtering and Display:** (No changes needed)
    *   Existing filtering logic in `zonesStore` and UI components should work.

**Data Flow Diagram:**

\`\`\`mermaid
graph LR
    A[User selects category and macrozones in Filters.tsx] --> B(Filters.tsx component updates filters in global store);
    B --> C{useEffect in Filters.tsx (removed DB fetch)};
    C --> D(Filters.tsx component dispatches setZones action to zonesStore with selected macrozones);
    D --> E{setZones action in zonesStore};
    E --> F[getZonesByMacrozones(macrozones) in lib/data/zones.ts];
    F --> G[Prisma query to database (Zone table, filter by mainMacrozone)];
    G --> H[Database returns Zone data];
    H --> E;
    E --> I(zonesStore updates zones and filteredZones state);
    I --> J[ZoneList.tsx and other UI components re-render];
\`\`\`