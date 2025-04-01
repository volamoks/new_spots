# Profile Page Refactoring Plan

## Goal

Refactor the `app/profile/page.tsx` component to be leaner by extracting the form logic and specific field components into separate files. This improves separation of concerns, reusability, testability, and maintainability.

## Data Source

The profile data (user name, email, category, INN) is managed through `next-auth/react`'s `useSession` hook, not a separate global state store. The refactoring will maintain this data flow.

## Steps

1.  **Extract `InnField` Component:**
    *   Create a new file: `app/components/profile/InnField.tsx`.
    *   Move the `InnField` component definition (currently lines 37-112 in `app/profile/page.tsx`) and its necessary imports (`useState`, `useEffect`, `useWatch`, `Input`, `FormField`, etc.) into this new file.
    *   Export the `InnField` component.

2.  **Extract `ProfileEditForm` Component:**
    *   Create a new file: `app/components/profile/ProfileEditForm.tsx`.
    *   Move the Zod schema definition (`formSchema`, currently lines 25-34) into this file.
    *   Move the entire form structure rendered in edit mode (currently lines 239-325 within `ProfilePage`) into this new component.
    *   Define props for this component:
        *   `form`: The `react-hook-form` instance.
        *   `onSubmit`: The submission handler function.
        *   `onCancel`: A function to handle cancellation (e.g., switching back to view mode).
        *   `isLoading`: The loading state.
        *   `session`: The user session data.
    *   Import necessary UI components (`Button`, `Input`, `Form`, etc.) and the new `InnField` component.

3.  **Update `app/profile/page.tsx`:**
    *   Remove the `InnField` definition and the Zod schema.
    *   Import the new `ProfileEditForm` component.
    *   Keep the `useSession`, `useRouter`, `useToast`, `useState` hooks.
    *   Keep the `useForm` hook initialization.
    *   Keep the `onSubmit` function definition.
    *   Keep the authentication/loading checks.
    *   Update the return statement to conditionally render `<UserProfileDisplay>` or `<ProfileEditForm>`, passing the required props.

## Visualized Structure

```mermaid
graph TD
    subgraph app/profile/page.tsx
        A[ProfilePage] --> B{useSession, useState, useForm, onSubmit};
        A --> C{Conditional Render};
        C -- isEditing=true --> D[ProfileEditForm];
        C -- isEditing=false --> E[UserProfileDisplay];
    end

    subgraph app/components/profile/ProfileEditForm.tsx
        F[ProfileEditForm Component] --> G[Zod Schema];
        F --> H[Form Fields];
        F --> I[InnField];
        F --> J[Submit/Cancel Buttons];
    end

    subgraph app/components/profile/InnField.tsx
        K[InnField Component] --> L[Input Logic + API Call];
    end

    subgraph app/components/profile/UserProfileDisplay.tsx
        M[UserProfileDisplay Component];
    end

    D -- props --> F;
    F -- imports --> K;
    E -- imports --> M;

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#f9f,stroke:#333,stroke-width:2px