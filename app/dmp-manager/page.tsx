'use client';

import { useSession } from 'next-auth/react';
import BookingRequestManagement from '../components/booking/BookingRequestManagement';

export default function DMPManagerPage() {
    // We still need the session for authentication, even if we don't use it directly
    useSession();

    return <BookingRequestManagement role="DMP_MANAGER" />;
}
