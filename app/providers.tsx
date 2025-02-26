'use client';

import type React from 'react';

import { SessionProvider } from 'next-auth/react';
import Navigation from '@/app/components/Navigation';
import { Session } from 'next-auth';

export function Providers({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session | null;
}) {
    return (
        <SessionProvider session={session}>
            <Navigation session={session} />
            {children}
        </SessionProvider>
    );
}
