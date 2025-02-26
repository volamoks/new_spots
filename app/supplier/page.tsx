"use client";

import { useState, useEffect } from "react";
import { Zone } from '@/types/zone';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
// import Navigation from "../components/Navigation";

export default function SupplierPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch("/api/zones");
        const data = await response.json();
        setZones(data);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
        toast({
          title: "Error",
          description: "Failed to fetch zones.",
          variant: "destructive",
        });
      }
    };

    fetchZones();
  }, [toast]);

  const handleZoneSelection = (zoneId: string) => {
    setSelectedZones((prevSelectedZones) =>
      prevSelectedZones.includes(zoneId)
        ? prevSelectedZones.filter((id) => id !== zoneId)
        : [...prevSelectedZones, zoneId]
    );
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zoneIds: selectedZones }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create booking request");
      }

      // const data = await response.json();
      toast({
        title: "Success",
        description: "Booking request created successfully.",
        variant: "success"
      });
      setSelectedZones([]); // Clear selected zones after successful submission
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error creating booking request:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* <Navigation /> */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-corporate">
              Панель поставщика
            </CardTitle>
            <CardDescription>
              Создание заявок на бронирование.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Выберите зоны:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-x-2 pb-2">
                    <CardTitle className="text-base font-medium">
                      {zone.city} - {zone.market} - {zone.number}
                    </CardTitle>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedZones.includes(zone.uniqueIdentifier)}
                      onChange={() => handleZoneSelection(zone.uniqueIdentifier)}
                    />
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Button
              className="mt-4"
              onClick={handleSubmit}
              disabled={selectedZones.length === 0}
            >
              Создать запрос
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}