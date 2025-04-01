'use client';

import { ZoneStatus } from '@/types/zone';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react'; // Import useSession

interface ZoneFilterTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isDisabled?: boolean;
    showAllTab?: boolean;
    className?: string;
    // role?: string; // Removed - Get from session
}

export function ZoneFilterTabs({
    activeTab,
    onTabChange,
    isDisabled = false,
    showAllTab = true,
    className = '',
}: // role = 'DMP_MANAGER', // Removed - Get from session
ZoneFilterTabsProps) {
    // --- Get session ---
    const { data: session } = useSession();
    const role = session?.user?.role; // Get role from session
    // ---

    // Если роль - поставщик или категорийный менеджер, не показываем табы
    // Они должны видеть только доступные зоны
    if (role === 'SUPPLIER' || role === 'CATEGORY_MANAGER') {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {showAllTab && (
                <Button
                    onClick={() => onTabChange('all')}
                    variant="ghost"
                    size="sm"
                    disabled={isDisabled}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                        activeTab === 'all'
                            ? 'bg-background text-foreground shadow'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    Все зоны
                </Button>
            )}
            <Button
                onClick={() => onTabChange(ZoneStatus.AVAILABLE)}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === ZoneStatus.AVAILABLE
                        ? 'bg-green-200 text-green-800 shadow'
                        : 'bg-green-100 text-green-600'
                }`}
            >
                Доступные
            </Button>
            <Button
                onClick={() => onTabChange(ZoneStatus.BOOKED)}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === ZoneStatus.BOOKED
                        ? 'bg-blue-200 text-blue-800 shadow'
                        : 'bg-blue-100 text-blue-600'
                }`}
            >
                Забронированные
            </Button>
            <Button
                onClick={() => onTabChange(ZoneStatus.UNAVAILABLE)}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === ZoneStatus.UNAVAILABLE
                        ? 'bg-red-200 text-red-800 shadow'
                        : 'bg-red-100 text-red-600'
                }`}
            >
                Недоступные
            </Button>
        </div>
    );
}
