'use client';

import { useSession } from 'next-auth/react';
import BookingRequestManagement from '../../components/booking/BookingRequestManagement';

export default function SupplierBookingsPage() {
    // We still need the session for authentication, even if we don't use it directly
    useSession();

    return (
        <BookingRequestManagement role="SUPPLIER" />
    );
}
