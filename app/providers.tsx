'use client';

import type React from 'react';

import { SessionProvider } from 'next-auth/react';
import Navigation from '@/app/components/Navigation';
import { Session } from 'next-auth';
import { GlobalLoader } from '@/app/components/GlobalLoader';

export function Providers({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session | null;
}) {
    return (
        <SessionProvider session={session}>
            <Navigation />
            {children}
            <GlobalLoader />
        </SessionProvider>
    );
}
