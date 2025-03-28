# Plan: Skip Excel Rows with Empty Fields

## Problem

The current Excel import logic for 'zones' (`app/api/upload-excel/route.ts`) processes all rows that pass basic validation. However, it encounters errors when rows have empty values in the 'Поставщик' (Supplier), 'Brand', or 'Категория товара' (Product Category) columns, likely during the database save operation.

## Goal

Modify the import logic to skip rows where any of these three specific fields ('Поставщик', 'Brand', 'Категория товара') are empty (null, undefined, or empty string) *before* attempting to save them to the database.

## Proposed Plan

1.  **Locate Data Processing:** Identify the section within the `POST` function in `app/api/upload-excel/route.ts` where `type === "zones"` is handled and data is prepared for saving (around line 158).
2.  **Filter Data:** Before the `Promise.all` call that maps rows to `createOrUpdateZone`, insert a filtering step. This step will create a new array containing only the rows from the original `data` where 'Поставщик', 'Brand', AND 'Категория товара' all have non-empty values.
3.  **Process Filtered Data:** Modify the `Promise.all` call to iterate over the *filtered* data array instead of the original `data` array.
4.  **Update Response Count:** Ensure the `count` returned in the final JSON response reflects the number of rows actually processed and saved (the length of the filtered array), not the total number of rows initially read from the Excel file.

## Visual Plan (Mermaid Diagram)

```mermaid
graph TD
    A[Start POST Request] --> B{Receive File and Type};
    B --> C[Read Excel File];
    C --> D[Parse Rows into 'data' array];
    D --> E{Check Import Type};
    E -- type === 'zones' --> F[Filter 'data': Keep rows where Поставщик, Brand, Категория товара are NOT empty];
    F --> G[Process Filtered Data: map(createOrUpdateZone)];
    G --> H[Save Zones to DB];
    E -- type === 'inn' --> I[Validate INN Data];
    I --> J[Process INN Data: map(createOrUpdateSupplier)];
    J --> K[Save Suppliers to DB];
    E -- other type --> L[Return Error: Unknown Type];
    H --> M[Return Success Response (using filtered count)];
    K --> M;
    F -- Validation Errors --> N[Return Validation Error Response];
    I -- Validation Errors --> N;

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:1px
    style M fill:#ccf,stroke:#333,stroke-width:1px