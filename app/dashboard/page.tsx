import Header from "../components/Header"

export default function Dashboard() {
  return (
    <div>
      <Header />
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Панель управления</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Активные бронирования</h2>
            <p className="text-3xl font-bold text-blue-600">3</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Предстоящие бронирования</h2>
            <p className="text-3xl font-bold text-green-600">2</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Всего потрачено</h2>
            <p className="text-3xl font-bold text-purple-600">15 000 ₽</p>
          </div>
        </div>
      </main>
    </div>
  )
}

