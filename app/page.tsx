import Link from "next/link"
import Navigation from "./components/Navigation"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Добро пожаловать в StoreSpotsBooking</h1>
        <p className="text-xl mb-4">Платформа для бронирования дополнительных зон продажи в магазинах</p>
        <ul className="list-disc list-inside text-lg">
          <li>Просматривайте доступные зоны продажи</li>
          <li>Используйте удобные фильтры для поиска подходящих зон</li>
          <li>Бронируйте зоны на нужные даты</li>
        </ul>
        <div className="flex gap-4 mt-8">
          <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Войти
          </Link>
          <Link href="/register" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Зарегистрироваться
          </Link>
        </div>
      </main>
      <footer className="bg-muted text-muted-foreground p-4 text-center">
        &copy; 2025 StoreSpotsBooking. Все права защищены.
      </footer>
    </div>
  )
}

