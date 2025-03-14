'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Zone } from '@/types/zone';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLoader } from "@/app/components/GlobalLoader";
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import { RefreshCw } from "lucide-react";
import { getCorrespondingMacrozones } from '@/lib/filterData';

// Интерфейс для поставщика
interface Supplier {
  id: string;
  name: string;
  supplierName?: string;
}

export default function CategoryManagerBookingsPage() {
  // Состояние
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [step, setStep] = useState<'supplier' | 'category' | 'zones'>('supplier'); // Три шага
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  
  // Refs для отслеживания состояния загрузки и предотвращения бесконечных циклов
  const dataLoaded = useRef(false);
  const categoryRef = useRef<string | null>(null);
  
  // Хуки
  const { data: session } = useSession();
  const { toast } = useToast();
  const { withLoading, setLoading } = useLoader();

  // Загрузка поставщиков при инициализации
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/suppliers');
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке поставщиков: ${response.status}`);
        }
        
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Ошибка загрузки поставщиков:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Произошла ошибка при загрузке поставщиков",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSuppliers();
  }, [setLoading, toast]);

  // Загрузка данных при инициализации
  useEffect(() => {
    // Если данные уже загружены или мы не на шаге выбора зон, не загружаем зоны
    if (dataLoaded.current || step !== 'zones') return;

    // Загружаем зоны для выбранной категории
    const loadZones = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/zones?category=${selectedCategory}`);
        
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
  }, [selectedCategory, toast, setLoading, step]);

  // Обработчик выбора поставщика и перехода к шагу 2
  const handleSupplierSelect = (supplierId: string): void => {
    console.log('Выбран поставщик:', supplierId);
    setSelectedSupplier(supplierId);
    setStep('category');
  };

  // Получаем список категорий из файла filterData.ts
  const categories = useMemo(() => {
    // Импортируем данные напрямую из модуля
    const { categoryData } = require('@/lib/filterData');
    return categoryData.map((item: { category: string }) => item.category);
  }, []);

  // Обработчик выбора категории и перехода к шагу 3
  const handleCategorySelect = (category: string): void => {
    console.log('Выбрана категория:', category);
    setSelectedCategory(category);
    setStep('zones');
    // Сбрасываем флаг загрузки данных, чтобы загрузить зоны
    dataLoaded.current = false;
  };

  // Фильтрация зон при изменении поискового запроса
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

    if (!selectedSupplier) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать поставщика",
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
            supplierId: selectedSupplier,
            category: selectedCategory
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

      // Сбрасываем выбранные зоны и возвращаемся к шагу 1
      setSelectedZones([]);
      setSelectedSupplier("");
      setSelectedCategory("");
      setStep('supplier');
      
      // Сбрасываем флаг загрузки данных
      dataLoaded.current = false;
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при создании бронирования",
        variant: "destructive",
      });
    }
  };

  // Обновление зон
  const refreshZones = async () => {
    if (selectedCategory) {
      try {
        setLoading(true);
        const response = await fetch(`/api/zones?category=${selectedCategory}`);
        
        if (!response.ok) {
          throw new Error(`Ошибка при обновлении зон: ${response.status}`);
        }
        
        const data = await response.json();
        setZones(data);
        setFilteredZones(data);
      } catch (error) {
        console.error("Ошибка обновления зон:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Произошла ошибка при обновлении зон",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Получение текущей страницы зон
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentZones = filteredZones.slice(startIndex, endIndex);

  // Обработчик выбора всех зон на текущей странице
  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      const newSelectedZones = [...selectedZones];
      currentZones.forEach(zone => {
        if (zone.status === "AVAILABLE" && !newSelectedZones.includes(zone.id)) {
          newSelectedZones.push(zone.id);
        }
      });
      setSelectedZones(newSelectedZones);
    } else {
      const zoneIdsOnPage = currentZones.map(zone => zone.id);
      setSelectedZones(selectedZones.filter(id => !zoneIdsOnPage.includes(id)));
    }
  };

  // Проверяем, выбраны ли все доступные зоны на текущей странице
  const areAllOnPageSelected = currentZones.length > 0 && 
    currentZones.filter(zone => zone.status === "AVAILABLE")
      .every(zone => selectedZones.includes(zone.id));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-600">Доступные зоны для бронирования</h1>
          <p className="text-gray-600">Выберите поставщика, категорию и зоны для создания заявки на бронирование</p>
        </div>

        {step === 'supplier' ? (
          /* Шаг 1: Выбор поставщика */
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Шаг 1: Выберите поставщика</h2>
              <p className="text-gray-600 mb-6">
                Выберите поставщика, чтобы продолжить бронирование зон.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => handleSupplierSelect(supplier.id)}
                    className={`p-4 rounded-md border cursor-pointer hover:bg-gray-100 ${
                      selectedSupplier === supplier.id 
                        ? 'bg-red-100 border-red-500 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {supplier.supplierName || supplier.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : step === 'category' ? (
          /* Шаг 2: Выбор категории */
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Шаг 2: Выберите категорию товара</h2>
              <p className="text-gray-600 mb-6">
                Выберите категорию товара, чтобы увидеть доступные зоны для бронирования.
              </p>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Выбранный поставщик:</h3>
                <Badge variant="outline" className="text-sm">
                  {suppliers.find(s => s.id === selectedSupplier)?.supplierName || 
                   suppliers.find(s => s.id === selectedSupplier)?.name || 
                   "Поставщик не выбран"}
                </Badge>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setStep('supplier')}
                  className="ml-2"
                >
                  Изменить
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: string) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-md border cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category 
                        ? 'bg-red-100 border-red-500 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {category}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Шаг 3: Выбор зон */
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Шаг 3: Выберите зоны для бронирования</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('category')}
                  className="ml-4"
                >
                  Вернуться к выбору категории
                </Button>
              </div>
              
              <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-blue-800 font-medium">
                  Выбранный поставщик: {suppliers.find(s => s.id === selectedSupplier)?.supplierName || 
                                       suppliers.find(s => s.id === selectedSupplier)?.name || 
                                       "Поставщик не выбран"}
                </p>
                <p className="text-blue-800 font-medium mt-1">
                  Выбранная категория: {selectedCategory || "Категория не выбрана"}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Доступные макрозоны: {getCorrespondingMacrozones(selectedCategory).length > 0 
                    ? getCorrespondingMacrozones(selectedCategory).join(', ') 
                    : 'Нет доступных макрозон'}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Всего зон в системе: {zones.length}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Отфильтровано зон: {filteredZones.length}
                </p>
              </div>
            </div>
            
            {/* Фильтры */}
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                {/* Поиск и кнопки действий */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Поиск по городу, магазину, макрозоне..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedZones([])}
                      disabled={selectedZones.length === 0}
                      className="whitespace-nowrap"
                    >
                      Очистить выбор
                    </Button>
                    <Button
                      onClick={refreshZones}
                      className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить
                    </Button>
                    <Button
                      onClick={handleCreateBooking}
                      disabled={selectedZones.length === 0}
                      className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                    >
                      Создать бронирование ({selectedZones.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Таблица зон */}
            <div className="bg-white rounded-md shadow overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Checkbox 
                            checked={areAllOnPageSelected}
                            onCheckedChange={handleSelectAllOnPage}
                            disabled={currentZones.length === 0}
                            className="mr-2"
                          />
                          Выбор
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Город
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Магазин
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Макрозона
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оборудование
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentZones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                          Зоны не найдены для выбранной категории
                        </td>
                      </tr>
                    ) : (
                      currentZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedZones.includes(zone.id)}
                              onCheckedChange={() => zone.status === "AVAILABLE" && handleZoneSelection(zone.id)}
                              disabled={zone.status !== "AVAILABLE"}
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.uniqueIdentifier}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.city}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.market}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.mainMacrozone}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.equipment}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              zone.status === "AVAILABLE" 
                                ? "bg-green-100 text-green-800" 
                                : zone.status === "BOOKED" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-red-100 text-red-800"
                            }`}>
                              {zone.status === "AVAILABLE" 
                                ? "Доступна" 
                                : zone.status === "BOOKED" 
                                  ? "Забронирована" 
                                  : "Недоступна"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Пагинация */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Показано {Math.min(filteredZones.length, startIndex + 1)} - {Math.min(filteredZones.length, endIndex)} из {filteredZones.length} зон
                </p>
              </div>
              
              <ZonePagination
                currentPage={currentPage}
                totalItems={zones.length}
                filteredItems={filteredZones.length}
                totalPages={Math.ceil(filteredZones.length / itemsPerPage)}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
