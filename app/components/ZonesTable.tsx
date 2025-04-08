'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Zone = {
    id: string;
    city: string;
    number: string;
    market: string;
    newFormat: string;
    equipment: string;
    dimensions: string;
    mainMacrozone: string;
    adjacentMacrozone: string;
};

type ZonesTableProps = {
    zones: Zone[];
};

export function ZonesTable({ zones }: ZonesTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="bg-yellow-200 font-medium">ID</TableHead>
                        <TableHead className="bg-blue-100 font-medium">Город</TableHead>
                        <TableHead className="bg-blue-100 font-medium">№</TableHead>
                        <TableHead className="bg-blue-100 font-medium">Маркет</TableHead>
                        <TableHead className="bg-blue-100 font-medium">Новый формат</TableHead>
                        <TableHead className="bg-blue-100 font-medium">Оборудование</TableHead>
                        <TableHead className="bg-blue-100 font-medium">Габариты</TableHead>
                        <TableHead className="bg-blue-100 font-medium">
                            Основная Макрозона
                        </TableHead>
                        <TableHead className="bg-blue-100 font-medium">Смежная макрозона</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {zones.map(zone => (
                        <TableRow key={zone.id}>
                            <TableCell>{zone.id}</TableCell>
                            <TableCell>{zone.city}</TableCell>
                            <TableCell>{zone.number}</TableCell>
                            <TableCell>{zone.market}</TableCell>
                            <TableCell>{zone.newFormat}</TableCell>
                            <TableCell>{zone.equipment}</TableCell>
                            <TableCell>{zone.dimensions}</TableCell>
                            <TableCell>{zone.mainMacrozone}</TableCell>
                            <TableCell>{zone.adjacentMacrozone}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
