'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// Removed store import
import { Card } from '@/components/ui/card';

// Define props for reusability
interface ZonePaginationProps {
    currentPage: number;
    itemsPerPage: number;
    totalCount: number;
    isLoading?: boolean;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (size: number) => void;
}

// Accept props instead of using the store hook
export function ZonePagination({
    currentPage,
    itemsPerPage,
    totalCount,
    isLoading = false,
    onPageChange,
    onItemsPerPageChange,
}: ZonePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const filteredItems = totalCount; // Use totalCount directly

    return (
        <Card className="flex sm:flex-row justify-between items-center gap-4 p-6">
            <div className="text-sm text-gray-500">
                Показано {Math.min(itemsPerPage, filteredItems - (currentPage - 1) * itemsPerPage)}{' '}
                из {filteredItems} зон{' '}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Элементов на странице:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={
                            value => onItemsPerPageChange(Number(value)) // Use prop callback
                        }
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={
                            () => onPageChange(Math.max(currentPage - 1, 1)) // Use prop callback
                        }
                        disabled={currentPage === 1 || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Предыдущая страница</span>
                    </Button>
                    <span className="text-sm">
                        Страница {currentPage} из {Math.max(1, totalPages)}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={
                            () => onPageChange(Math.min(currentPage + 1, totalPages)) // Use prop callback
                        }
                        disabled={currentPage >= totalPages || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Следующая страница</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
