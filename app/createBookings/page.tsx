'use client';

import { useSession } from 'next-auth/react';

import CreateBookingPage from '@/app/components/booking/CreateBookingPage';

export default function SupplierBookingsPage() {
    // We still need the session for authentication, even if we don't use it directly
    useSession();

    // return <CreateBookingPage role="SUPPLIER" />;
    return <CreateBookingPage />;
}
