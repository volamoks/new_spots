import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-white shadow-md">
            <nav className="container mx-auto px-6 py-3">
                <ul className="flex justify-between items-center">
                    <li>
                        <Link
                            href="/"
                            className="text-lg font-semibold"
                        >
                            Store Spots Booking
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/dashboard"
                            className="text-gray-800 hover:text-blue-600"
                        >
                            Панель управления
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/catalog"
                            className="text-gray-800 hover:text-blue-600"
                        >
                            Каталог зон
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/profile"
                            className="text-gray-800 hover:text-blue-600"
                        >
                            Профиль
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
