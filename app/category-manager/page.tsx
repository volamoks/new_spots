"use client"

import { useMemo } from "react"
import { RequestsTable } from "../components/RequestsTable"
import { RequestFilters } from "../components/RequestFilters"
import { CategoryManagerDashboard } from "../components/CategoryManagerDashboard"
import Navigation from "../components/Navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { useGlobalStore } from "@/lib/store"

export default function CategoryManagerPage() {
  const { filteredRequests, handleApprove, handleReject, handleFilterChange } = useGlobalStore()

  const filteredSpotsCount = useMemo(() => {
    return filteredRequests.reduce((acc, request) => acc + request.zones.length, 0)
  }, [filteredRequests])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">Панель категорийного менеджера</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList>
                <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
                <TabsTrigger value="requests">Заявки</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="mt-6">
                <CategoryManagerDashboard />
              </TabsContent>
              <TabsContent value="requests" className="mt-6">
                <div className="space-y-6">
                  <p className="text-gray-600">Управляйте заявками на бронирование зон продаж</p>
                  <p className="text-gray-600">
                    Отфильтровано спотов: <span className="font-semibold">{filteredSpotsCount}</span>
                  </p>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestFilters onFilterChange={handleFilterChange} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Заявки на бронирование</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestsTable
                        requests={filteredRequests}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        role="КМ"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}

