
import ZoneList from "./ZoneList"

export default function ZonesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Доступные зоны продажи</h1>
        <ZoneList />
      </main>
    </div>
  )
}

e