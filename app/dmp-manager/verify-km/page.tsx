"use client"

import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"

type PendingKM = {
  id: string
  name: string
  email: string
  category: string
  registrationDate: string
}

export default function VerifyKMPage() {
  const [pendingKMs, setPendingKMs] = useState<PendingKM[]>([])
  // const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth("DMP_MANAGER")

  useEffect(() => {
    if (isAuthenticated && user?.role === "DMP_MANAGER") {
      fetchPendingKMs()
    }
  }, [isAuthenticated, user])

  const fetchPendingKMs = async () => {
    try {
      const response = await fetch("/api/dmp/pending-kms")
      if (!response.ok) throw new Error("Failed to fetch pending KMs")
      const data = await response.json()
      setPendingKMs(data)
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список ожидающих подтверждения КМ",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (kmId: string) => {
    try {
      const response = await fetch(`/api/dmp/approve-km/${kmId}`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to approve KM")
      toast({
        title: "Успешно",
        description: "Категорийный менеджер успешно подтвержден",
        variant: "success",
      })
      fetchPendingKMs() // Refresh the list
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить категорийного менеджера",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (kmId: string) => {
    try {
      const response = await fetch(`/api/dmp/reject-km/${kmId}`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to reject KM")
      toast({
        title: "Успешно",
        description: "Категорийный менеджер успешно отклонен",
        variant: "success",
      })
      fetchPendingKMs() // Refresh the list
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить категорийного менеджера",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated || user?.role !== "DMP_MANAGER") {
    return null // Or a loading state
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">Подтверждение категорийных менеджеров</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKMs.map((km) => (
                  <TableRow key={km.id}>
                    <TableCell>{km.name}</TableCell>
                    <TableCell>{km.email}</TableCell>
                    <TableCell>{km.category}</TableCell>
                    <TableCell>{new Date(km.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleApprove(km.id)} className="mr-2">
                        Подтвердить
                      </Button>
                      <Button onClick={() => handleReject(km.id)} variant="destructive">
                        Отклонить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pendingKMs.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                Нет ожидающих подтверждения категорийных менеджеров
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
