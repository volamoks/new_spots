'use client';

import { useEffect } from 'react'; // Keep useEffect for potential future use or remove if truly unused
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Import the new content component
import UserProfilePageContent from '@/app/components/profile/UserProfilePageContent';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Effect for handling redirection MUST be called unconditionally at the top level
    useEffect(() => {
        // Only redirect if the status is determined and not loading
        if (status !== 'loading') {
            if (status === 'unauthenticated') {
                console.log('User unauthenticated, redirecting to login.');
                router.push('/login');
            } else if (status === 'authenticated' && (!session || !session.user)) {
                // This case might indicate an issue with session data sync
                console.error(
                    'Authenticated but session or user data is missing. Redirecting to login.',
                );
                router.push('/login');
            }
        }
    }, [status, session, router]);

    // Handle loading state for session
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">Загрузка сессии...</div>
        );
    }

    // If authenticated and session data looks valid, render the main content
    // The redirection logic is handled in the useEffect above
    // The UserProfilePageContent component now handles its internal logic
    if (status === 'authenticated' && session?.user) {
        return <UserProfilePageContent />;
    }

    // Fallback return (e.g., while redirecting or if checks fail unexpectedly)
    // Returning null or a minimal loader might be appropriate here
    return null; // Or a loading indicator if preferred during the brief redirect period
}
