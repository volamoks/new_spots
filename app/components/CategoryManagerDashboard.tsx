"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useGlobalStore } from "@/lib/store"

export function CategoryManagerDashboard() {
  const {
    selectedSupplier,
    selectedZones,
    suppliers,
    supplierData,
    setSelectedSupplier,
    toggleZoneSelection,
    clearSelectedZones,
  } = useGlobalStore()

  const handleBooking = () => {
    toast({
      title: "Бронирование выполнено",
      description: `Выбранные зоны (${selectedZones.length}) успешно забронированы.`,
    })
    clearSelectedZones()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Выберите поставщика</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedSupplier} value={selectedSupplier}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Выберите поставщика" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier} value={supplier}>
                  {supplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {supplierData && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Всего спотов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{supplierData.totalSpots}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Количество брендов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{supplierData.brands.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Количество городов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{supplierData.locations.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Распределение по брендам</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Бренд</TableHead>
                      <TableHead>Количество спотов</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierData.spotsPerBrand.map(({ brand, count }) => (
                      <TableRow key={brand}>
                        <TableCell>{brand}</TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Распределение по городам</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Город</TableHead>
                      <TableHead>Количество спотов</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierData.spotsPerLocation.map(({ city, count }) => (
                      <TableRow key={city}>
                        <TableCell>{city}</TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Детали спотов</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Выбрать</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Город</TableHead>
                    <TableHead>Маркет</TableHead>
                    <TableHead>Оборудование</TableHead>
                    <TableHead>Бренд</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierData.zones.map((zone) => (
                    <TableRow
                      key={zone["Уникальный идентификатор"]}
                      className={selectedZones.includes(zone["Уникальный идентификатор"]) ? "bg-muted" : ""}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedZones.includes(zone["Уникальный идентификатор"])}
                          onChange={() => toggleZoneSelection(zone["Уникальный идентификатор"])}
                        />
                      </TableCell>
                      <TableCell>{zone["ID"]}</TableCell>
                      <TableCell>{zone["Город"]}</TableCell>
                      <TableCell>{zone["Маркет"]}</TableCell>
                      <TableCell>{zone["Оборудование"]}</TableCell>
                      <TableCell>{zone["Brand"]}</TableCell>
                      <TableCell>{zone["Статус"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedZones.length > 0 && (
                <div className="mt-4">
                  <Button onClick={handleBooking} className="bg-corporate hover:bg-corporate-dark text-white">
                    Забронировать выбранные зоны ({selectedZones.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

