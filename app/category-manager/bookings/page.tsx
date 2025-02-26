"use client";

import { useState, useEffect, useRef } from "react";
import { Zone } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { useLoader } from "@/app/components/GlobalLoader";
import { Badge } from "@/components/ui/badge";

export default function CategoryManagerBookingsPage() {
  // Состояние
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Refs для отслеживания состояния загрузки и предотвращения бесконечных циклов
  const dataLoaded = useRef(false);
  const categoryRef = useRef<string | null>(null);
  
  // Хуки
  const { data: session } = useSession();
  const { toast } = useToast();
  const { withLoading, setLoading } = useLoader();

  // Загрузка данных при инициализации
  useEffect(() => {
    // Если данные уже загружены, не загружаем их повторно
    if (dataLoaded.current) return;

    const userCategory = session?.user?.category;
    
    // Если категория изменилась, обновляем ref и загружаем данные
    if (userCategory !== categoryRef.current) {
      categoryRef.current = userCategory || null;
      
      if (!userCategory) {
        toast({
          title: "Внимание",
          description: "Для вашего аккаунта не указана категория. Обратитесь к администратору.",
          variant: "destructive",
        });
        return;
      }

      // Загружаем зоны для категории
      const loadZones = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/zones?category=${userCategory}`);
          
          if (!response.ok) {
            throw new Error(`Ошибка при загрузке зон: ${response.status}`);
          }
          
          const data = await response.json();
          setZones(data);
          setFilteredZones(data);
          
          // Помечаем, что данные загружены
          dataLoaded.current = true;
        } catch (error) {
          console.error("Ошибка загрузки зон:", error);
          toast({
            title: "Ошибка",
            description: error instanceof Error ? error.message : "Произошла ошибка при загрузке зон",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadZones();
    }
  }, [session, toast, setLoading]);

  // Фильтрация зон при изменении поискового запроса (без зависимости от zones)
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredZones(zones);
    } else {
      const searchLower = term.toLowerCase();
      const filtered = zones.filter(zone =>
        zone.city.toLowerCase().includes(searchLower) ||
        zone.market.toLowerCase().includes(searchLower) ||
        zone.mainMacrozone.toLowerCase().includes(searchLower) ||
        zone.uniqueIdentifier.toLowerCase().includes(searchLower)
      );
      setFilteredZones(filtered);
    }
  };

  // Обработчик выбора зоны
  const handleZoneSelection = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  // Обработчик создания бронирования
  const handleCreateBooking = async () => {
    if (selectedZones.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну зону для бронирования",
        variant: "destructive",
      });
      return;
    }

    try {
      await withLoading(
        fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            zoneIds: selectedZones,
            category: categoryRef.current
          }),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка при создании бронирования");
          }
          return response.json();
        }),
        "Создание бронирования..."
      );

      toast({
        title: "Успешно",
        description: "Заявка на бронирование успешно создана",
        variant: "default",
      });

      // Сбрасываем выбранные зоны
      setSelectedZones([]);
      
      // Обновляем список зон - принудительно сбрасываем флаг загрузки и загружаем заново
      dataLoaded.current = false;
      
      // Загружаем зоны для категории повторно
      try {
        setLoading(true);
        const response = await fetch(`/api/zones?category=${categoryRef.current}`);
        
        if (!response.ok) {
          throw new Error(`Ошибка при обновлении зон: ${response.status}`);
        }
        
        const data = await response.json();
        setZones(data);
        setFilteredZones(data);
        
        // Помечаем, что данные загружены
        dataLoaded.current = true;
      } catch (error) {
        console.error("Ошибка обновления зон:", error);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при создании бронирования",
        variant: "destructive",
      });
    }
  };

  // Получение класса статуса для стилизации
  const getStatusClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-300";
      case "BOOKED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "UNAVAILABLE":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Статусы на русском
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      AVAILABLE: "Доступна",
      BOOKED: "Забронирована",
      UNAVAILABLE: "Недоступна",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Создание бронирований
            </CardTitle>
            <CardDescription>
              Выберите зоны вашей категории для создания заявки на бронирование
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Ваша категория:</h3>
              <Badge variant="outline" className="text-sm">
                {categoryRef.current || "Категория не указана"}
              </Badge>
            </div>
            
            <div className="mb-6">
              <Input
                placeholder="Поиск по городу, магазину или идентификатору..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="mb-4"
              />
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Доступные зоны:</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedZones([])}
                  disabled={selectedZones.length === 0}
                >
                  Очистить выбор
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Отображено {filteredZones.length} из {zones.length} зон.
                Выбрано: {selectedZones.length}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredZones.length > 0 ? (
                filteredZones.map((zone) => (
                  <Card 
                    key={zone.id} 
                    className={`cursor-pointer transition-all ${
                      selectedZones.includes(zone.id) 
                        ? "border-primary ring-2 ring-primary/20" 
                        : ""
                    }`}
                    onClick={() => zone.status === "AVAILABLE" && handleZoneSelection(zone.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">
                          {zone.uniqueIdentifier}
                        </CardTitle>
                        {zone.status === "AVAILABLE" ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedZones.includes(zone.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleZoneSelection(zone.id);
                            }}
                          />
                        ) : (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusClass(zone.status)}`}
                          >
                            {getStatusLabel(zone.status)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        <span className="font-semibold">Город:</span> {zone.city}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Магазин:</span> {zone.market}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Макрозона:</span> {zone.mainMacrozone}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {zones.length === 0
                    ? "Зоны не найдены для вашей категории"
                    : "Нет зон, соответствующих поисковому запросу"}
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateBooking}
              disabled={selectedZones.length === 0}
              className="w-full md:w-auto"
            >
              Создать бронирование ({selectedZones.length})
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}