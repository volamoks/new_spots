'use client'

import { useEffect } from "react"
            import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
            import { Button } from "@/components/ui/button"
            import { Badge } from "@/components/ui/badge"
            import Filters from "../components/Filters"
            import { MapPin, Store, Box, Tag } from "lucide-react"
            import { useGlobalStore } from "@/lib/store"
            import { useBookings } from "@/lib/hooks/useBookings"
            import { useToast } from "@/components/ui/use-toast"

            export default function ZoneList() {
              const { filteredZones, selectedZones, filters, toggleZoneSelectionForBooking } = useGlobalStore()
              const { createBooking, isLoading, error } = useBookings()
              const { toast } = useToast()

              const showZones = filters.category && filters.macrozone

              useEffect(() => {
                if (error) {
                  toast({
                    title: "Ошибка",
                    description: error,
                    variant: "destructive",
                  })
                }
              }, [error, toast])

              const handleBooking = async () => {
                if (selectedZones.length === 0) {
                  toast({
                    title: "Выберите зоны",
                    description: "Пожалуйста, выберите хотя бы одну зону для бронирования.",
                    variant: "default",
                  })
                  return
                }
          
                const startDate = new Date() // You might want to use a date picker in your UI
                const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

                try {
                    await createBooking(selectedZones, startDate, endDate);
                    toast({
                        title: "Бронирование выполнено",
                        description: `Выбранные зоны (${selectedZones.length}) успешно забронированы.`,
                        variant: "success",
                    });
                } catch (error) {
                    // The useEffect hook will handle displaying the error toast
                }
            };

            return (
                <div className="container mx-auto px-4 py-8">
                  <Filters />
                  {showZones ? (
                    <>
                      <div className="mb-6 flex justify-between items-center">
                        <p className="text-lg font-semibold">
                          Найдено спотов: <span className="text-[#D12D35]">{filteredZones.length}</span>
                        </p>
                        {selectedZones.length > 0 && (
                          <Button
                            onClick={handleBooking}
                            className="bg-[#D12D35] hover:bg-[#B02028] text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? "Бронирование..." : `Забронировать выбранные зоны (${selectedZones.length})`}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredZones.map((zone) => (
                                      <Card
                                        key={zone.uniqueIdentifier}
                                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                          selectedZones.includes(zone.uniqueIdentifier)
                                            ? "border-[#D12D35] border-2 shadow-lg"
                                            : "hover:border-gray-300"
                                        }`}
                                        onClick={() => toggleZoneSelectionForBooking(zone.uniqueIdentifier)}
                                      >
                                        <CardHeader className="bg-secondary border-b">
                                          <CardTitle className="flex justify-between items-center text-lg">
                                            <span>Зона №{zone.id}</span>
                                            <Badge variant={zone.status === "AVAILABLE" ? "default" : "secondary"}>{zone.status}</Badge>
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                          <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4 text-[#D12D35]" />
                                            <span className="text-foreground">{zone.city}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Store className="w-4 h-4 text-[#D12D35]" />
                                            <span className="text-foreground">
                                              {zone.market} ({zone.newFormat})
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Box className="w-4 h-4 text-[#D12D35]" />
                                            <span className="text-foreground">{zone.dimensions}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Tag className="w-4 h-4 text-[#D12D35]" />
                                            <span className="text-foreground">{zone.equipment}</span>
                                          </div>
                                        </CardContent>
                                        <CardFooter className="bg-secondary border-t">
                                          <div className="w-full text-sm text-muted-foreground">
                                            <p>Основная макрозона: {zone.mainMacrozone}</p>
                                            <p>Смежные макрозоны: {zone.adjacentMacrozone}</p>
                                          </div>
                                        </CardFooter>
                                      </Card>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-center mt-4 text-muted-foreground">
                                  Пожалуйста, выберите категорию и макрозону для отображения доступных зон.
                                </p>
                              )}
                            </div>
                          )
                        }
