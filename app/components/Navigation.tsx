'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast'; // Import useToast

export default function Navigation() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast(); // Initialize useToast

    const handleLogout = async () => {
        await signOut({ redirect: false });
        toast({
            // Add toast call
            title: 'Выход',
            description: 'Вы успешно вышли из системы.',
        });
        router.push('/login');
    };

    const renderRoleSpecificLinks = (role: string) => {
        switch (role) {
            case 'SUPPLIER':
                return (
                    <>
                        <Link href="/createBookings">
                            <Button variant="ghost">Создать Бронирование</Button>
                        </Link>
                        <Link href="/manageBookings">
                            <Button variant="ghost">Мои бронирования</Button>
                        </Link>
                    </>
                );
            case 'CATEGORY_MANAGER':
                return (
                    <>
                        <Link href="/createBookings">
                            <Button variant="ghost">Создать бронирование</Button>
                        </Link>
                        <Link href="/manageBookings">
                            <Button variant="ghost">Управление Бронированиями</Button>
                        </Link>
                    </>
                );
            case 'DMP_MANAGER':
                return (
                    <>
                        <Link href="/manageBookings">
                            <Button variant="ghost">Управление Бронированиями</Button>
                        </Link>
                        <Link href="/manageZones">
                            <Button variant="ghost">Управление Зонами</Button>
                        </Link>
                        <Link href="/importExportData">
                            <Button variant="ghost">Экспорт/Импорт Данных</Button>
                        </Link>
                        <Link href="/approvalAccounts">
                            <Button variant="ghost">Подтверждение КМ</Button>
                        </Link>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <nav className="bg-primary text-primary-foreground p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    href="/"
                    className="text-2xl font-bold"
                >
                    StoreSpotsBooking
                </Link>
                <div className="space-x-4 flex items-center">
                    {status === 'authenticated' && session?.user ? (
                        <>
                            {renderRoleSpecificLinks(session.user.role)}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost">
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        {session.user.name}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">Профиль</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout}>
                                        Выйти
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost">Войти</Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="ghost">Зарегистрироваться</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
