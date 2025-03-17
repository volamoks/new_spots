import React from 'react';
import { Zone } from '@/types/zone';
import { Checkbox } from '@/components/ui/checkbox';
import { useBookingStore } from '@/lib/stores/bookingStore';
// import { useZonesStore } from '@/lib/zonesStore';

interface ZonesTableProps {
    zones: Zone[];
}

const ZonesTable: React.FC<ZonesTableProps> = ({ zones }) => {
    // const { zones, isLoading } = useZonesStore();
    const { addSelectedZone, removeSelectedZone, selectedZones } = useBookingStore();

    const handleZoneSelection = (uniqueIdentifier: string) => {
        if (selectedZones.includes(uniqueIdentifier)) {
            removeSelectedZone(uniqueIdentifier);
        } else {
            addSelectedZone(uniqueIdentifier);
        }
    };

    return (
        <div className="bg-white rounded-md shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                <div className="flex items-center">
                                    <Checkbox
                                        checked={
                                            zones.length > 0 &&
                                            zones.every(zone =>
                                                selectedZones.includes(zone.uniqueIdentifier),
                                            )
                                        }
                                        onCheckedChange={checked => {
                                            if (checked) {
                                                zones.forEach(zone => {
                                                    if (
                                                        !selectedZones.includes(
                                                            zone.uniqueIdentifier,
                                                        )
                                                    ) {
                                                        addSelectedZone(zone.uniqueIdentifier);
                                                    }
                                                });
                                            } else {
                                                zones.forEach(zone => {
                                                    removeSelectedZone(zone.uniqueIdentifier);
                                                });
                                            }
                                        }}
                                        disabled={zones.length === 0}
                                        className="mr-2"
                                    />
                                    Выбор
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                ID
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Город
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Магазин
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Макрозона
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Оборудование
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Статус
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {zones.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-3 py-4 text-center text-sm text-gray-500"
                                >
                                    Нет доступных зон
                                </td>
                            </tr>
                        ) : (
                            zones.map(zone => (
                                <tr
                                    key={zone.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <Checkbox
                                            checked={selectedZones.includes(zone.uniqueIdentifier)}
                                            onCheckedChange={() =>
                                                handleZoneSelection(zone.uniqueIdentifier)
                                            }
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
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Доступна
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ZonesTable;
