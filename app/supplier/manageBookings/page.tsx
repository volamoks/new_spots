'use client';

import BookingRequestManagement from '@/app/components/booking/BookingRequestManagement';
import { useSession } from 'next-auth/react';

export default function CategoryManagerPage() {
    // We still need the session for authentication, even if we don't use it directly
    useSession();

    return <BookingRequestManagement role="SUPPLIER" />;
}
