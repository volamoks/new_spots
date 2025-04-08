// 'use client';

// import { useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import Filters from '../components/Filters'; // Assuming Filters component triggers store actions now
// import { MapPin, Store, Box, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
// import { useZonesStore } from '@/lib/stores/zonesStore'; // Import the correct store
// import { useBookings } from '@/lib/hooks/useBookings'; // Assuming this is still needed for booking action
// import { useToast } from '@/components/ui/use-toast';

// export default function ZoneList() {
//     // Get state and actions from the updated zones store
//     const {
//         zones, // Now holds only the current page's zones
//         totalCount,
//         isLoading: isLoadingZones, // Renamed to avoid conflict
//         error: zonesError, // Renamed to avoid conflict
//         paginationCriteria,
//         selectedZoneIds, // Use selectedZoneIds from the store
//         toggleZoneSelection, // Use action from the store
//         setPaginationCriteria,
//         fetchZones, // Action to fetch zones
//     } = useZonesStore();

//     // Booking specific hook (assuming it's separate)
//     const { createBooking, isLoading: isBookingLoading, error: bookingError } = useBookings();
//     const { toast } = useToast();

//     // Fetch initial data on component mount
//     useEffect(() => {
//         fetchZones();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []); // Fetch only once on mount

//     // Handle booking and zones errors
//     useEffect(() => {
//         const errorToShow = zonesError || bookingError;
//         if (errorToShow) {
//             toast({
//                 title: 'Ошибка',
//                 description: errorToShow,
//                 variant: 'destructive',
//             });
//         }
//     }, [zonesError, bookingError, toast]);

//     const handleBooking = async () => {
//         const selectedIdsArray = Array.from(selectedZoneIds); // Convert Set to Array
//         if (selectedIdsArray.length === 0) {
//             toast({
//                 title: 'Выберите зоны',
//                 description: 'Пожалуйста, выберите хотя бы одну зону для бронирования.',
//                 variant: 'default',
//             });
//             return;
//         }

//         const startDate = new Date(); // Placeholder
//         const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Placeholder

//         try {
//             // Pass the array of selected IDs
//             await createBooking(selectedIdsArray, startDate, endDate);
//             toast({
//                 title: 'Бронирование выполнено',
//                 description: `Выбранные зоны (${selectedIdsArray.length}) успешно забронированы.`,
//                 variant: 'success',
//             });
//             // Optionally clear selection or refetch zones after booking
//             // useZonesStore.getState().clearSelection();
//             // fetchZones();
//         } catch (error) {
//             console.error('Failed to create booking:', error);
//             // Error toast is handled by the useEffect hook
//         }
//     };

//     // Pagination calculations
//     const { currentPage, itemsPerPage } = paginationCriteria;
//     const totalPages = Math.ceil(totalCount / itemsPerPage);

//     const handlePageChange = (newPage: number) => {
//         if (newPage >= 1 && newPage <= totalPages) {
//             setPaginationCriteria({ currentPage: newPage });
//             // fetchZones is automatically called by setPaginationCriteria now
//         }
//     };

//     // Determine if filters are set sufficiently to show zones (adjust logic if needed)
//     // This might need refinement based on how Filters component interacts with the store
//     const filtersSet = useZonesStore(
//         state =>
//             state.filterCriteria.macrozoneFilters.length >
//             0 /* && state.filterCriteria.categoryFilter */,
//     ); // Example check

//     return (
//         <div className="container mx-auto px-4 py-8">
//             <Filters /> {/* Ensure Filters component uses setFilterCriteria from store */}
//             {isLoadingZones && <p>Загрузка зон...</p>}
//             {zonesError && !isLoadingZones && (
//                 <p className="text-red-500">Ошибка загрузки зон: {zonesError}</p>
//             )}
//             {!isLoadingZones && !zonesError && (
//                 <>
//                     {filtersSet ? (
//                         <>
//                             <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
//                                 <p className="text-lg font-semibold">
//                                     Найдено спотов:{' '}
//                                     <span className="text-[#D12D35]">{totalCount}</span>
//                                     {totalPages > 1 && (
//                                         <span className="text-sm text-gray-500 ml-2">
//                                             (Стр. {currentPage} из {totalPages})
//                                         </span>
//                                     )}
//                                 </p>
//                                 {selectedZoneIds.size > 0 && (
//                                     <Button
//                                         onClick={handleBooking}
//                                         className="bg-[#D12D35] hover:bg-[#B02028] text-white"
//                                         disabled={isBookingLoading}
//                                     >
//                                         {isBookingLoading
//                                             ? 'Бронирование...'
//                                             : `Забронировать выбранные зоны (${selectedZoneIds.size})`}
//                                     </Button>
//                                 )}
//                             </div>

//                             {zones.length > 0 ? (
//                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                                     {zones.map(zone => (
//                                         <Card
//                                             key={zone.uniqueIdentifier} // Assuming uniqueIdentifier is stable
//                                             className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
//                                                 selectedZoneIds.has(zone.id) // Check by ID
//                                                     ? 'border-[#D12D35] border-2 shadow-lg'
//                                                     : 'hover:border-gray-300'
//                                             }`}
//                                             onClick={() => toggleZoneSelection(zone.id)} // Toggle by ID
//                                         >
//                                             <CardHeader className="bg-secondary border-b">
//                                                 <CardTitle className="flex justify-between items-center text-lg">
//                                                     <span>
//                                                         Зона{' '}
//                                                         {zone.externalId || zone.uniqueIdentifier}
//                                                     </span>
//                                                     <Badge
//                                                         variant={
//                                                             zone.status === 'AVAILABLE'
//                                                                 ? 'default'
//                                                                 : 'secondary'
//                                                         }
//                                                     >
//                                                         {zone.status}
//                                                     </Badge>
//                                                 </CardTitle>
//                                             </CardHeader>
//                                             <CardContent className="space-y-4 pt-4">
//                                                 <div className="flex items-center space-x-2">
//                                                     <MapPin className="w-4 h-4 text-[#D12D35]" />
//                                                     <span className="text-foreground">
//                                                         {zone.city}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <Store className="w-4 h-4 text-[#D12D35]" />
//                                                     <span className="text-foreground">
//                                                         {zone.market} ({zone.newFormat})
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <Box className="w-4 h-4 text-[#D12D35]" />
//                                                     <span className="text-foreground">
//                                                         {zone.dimensions}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <Tag className="w-4 h-4 text-[#D12D35]" />
//                                                     <span className="text-foreground">
//                                                         {zone.equipment}
//                                                     </span>
//                                                 </div>
//                                             </CardContent>
//                                             <CardFooter className="bg-secondary border-t">
//                                                 <div className="w-full text-sm text-muted-foreground">
//                                                     <p>Основная макрозона: {zone.mainMacrozone}</p>
//                                                 </div>
//                                             </CardFooter>
//                                         </Card>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <p className="text-center mt-4 text-muted-foreground">
//                                     Нет зон, соответствующих заданным фильтрам.
//                                 </p>
//                             )}

//                             {/* Pagination Controls */}
//                             {totalPages > 1 && (
//                                 <div className="mt-6 flex justify-center items-center space-x-4">
//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handlePageChange(currentPage - 1)}
//                                         disabled={currentPage <= 1 || isLoadingZones}
//                                     >
//                                         <ChevronLeft className="h-4 w-4 mr-1" />
//                                         Пред.
//                                     </Button>
//                                     <span className="text-sm text-muted-foreground">
//                                         Стр. {currentPage} из {totalPages}
//                                     </span>
//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handlePageChange(currentPage + 1)}
//                                         disabled={currentPage >= totalPages || isLoadingZones}
//                                     >
//                                         След.
//                                         <ChevronRight className="h-4 w-4 ml-1" />
//                                     </Button>
//                                 </div>
//                             )}
//                         </>
//                     ) : (
//                         <p className="text-center mt-4 text-muted-foreground">
//                             Пожалуйста, выберите фильтры для отображения доступных зон.
//                         </p>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// }
