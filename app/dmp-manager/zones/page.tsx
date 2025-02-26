"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZonesManagementTable } from "@/app/components/ZonesManagementTable";
import { useSession } from "next-auth/react";
import { useLoader } from "@/app/components/GlobalLoader";
import { useToast } from "@/components/ui/use-toast";
import { Zone } from "@prisma/client";

export default function DMPManagerZonesPage() {
  const { data: session } = useSession();
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const { withLoading } = useLoader();
  const { toast } = useToast();

  // Функция для загрузки зон из API
  const loadZones = useCallback(async () => {
    if (!session) return;

    try {
      const result = await withLoading(
        fetch("/api/zones").then(res => {
          if (!res.ok) throw new Error("Ошибка при загрузке зон");
          return res.json();
        }),
        "Загрузка зон..."
      );
      
      setZones(result);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при загрузке зон",
        variant: "destructive",
      });
    }
  }, [session, withLoading, toast]);

  // Загружаем зоны при загрузке страницы
  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // Фильтрация зон по вкладкам
  const getFilteredZones = useCallback(() => {
    switch (activeTab) {
      case "available":
        return zones.filter(zone => zone.status === "AVAILABLE");
      case "booked":
        return zones.filter(zone => zone.status === "BOOKED");
      case "unavailable":
        return zones.filter(zone => zone.status === "UNAVAILABLE");
      default:
        return zones;
    }
  }, [zones, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Управление зонами
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Просматривайте и изменяйте статусы зон в системе
            </p>
            <p className="text-gray-600 mt-2">
              Всего зон в системе: <span className="font-semibold">{zones.length}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Таблица зон
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Все зоны</TabsTrigger>
                <TabsTrigger value="available">Доступные</TabsTrigger>
                <TabsTrigger value="booked">Забронированные</TabsTrigger>
                <TabsTrigger value="unavailable">Недоступные</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
                <ZonesManagementTable 
                  zones={getFilteredZones()}
                  onRefresh={loadZones}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}