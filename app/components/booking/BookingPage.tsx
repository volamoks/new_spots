// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useZonesStore } from '@/lib/stores/zonesStore';
// import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore'; // Import correct store
// import CategorySelection from './booking/CategorySelection';
// // import BookingPageHeader from './booking/BookingPageHeader';
// import SupplierSelection from './booking/SupplierSelection';
// import { Card, CardContent, CardTitle } from '@/components/ui/card';

// export default function BookingPage() {
//     const { isAuthenticated, user } = useAuth();
//     const setSelectedSupplierInnForCreation = useBookingActionsStore(
//         state => state.setSelectedSupplierInnForCreation,
//     );
//     const [selectedCategory, setSelectedCategory] = useState<string>('');

//     const setSelectedCategoryCallback = useCallback((category: string) => {
//         setSelectedCategory(category);
//     }, []);

//     const { fetchZones, totalCount } = useZonesStore(state => ({
//         fetchZones: state.fetchZones,
//         totalCount: state.totalCount,
//     }));

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchZones();
//         }
//     }, [isAuthenticated, fetchZones]); // Removed user?.role dependency

//     useEffect(() => {
//         if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
//             setSelectedSupplierInnForCreation(user.inn);
//         }
//         // Ensure dependency array includes the correct action name
//     }, [isAuthenticated, user, setSelectedSupplierInnForCreation]);

//     // Inline styles for brevity

//     return (
//         <div className="min-h-screen flex flex-col bg-gray-50">
//             <main className="flex-grow container mx-auto px-4 py-8">
//                 <CardTitle className="text-2xl font-bold text-red-600 ">
//                     Доступные зоны для бронирования
//                 </CardTitle>
//                 <p className="text-gray-600 mt-4">
//                     Выберите зоны для создания заявки на бронирование.
//                 </p>
//                 <p className="text-gray-600 mt-4 text-m">
//                     Всего доступных зон1 найдено (с учетом фильтров): {totalCount}{' '}
//                 </p>

//                 <div className="space-y-6">
//                     {/* Category Selection at the top */}
//                     <Card className="mb-6">
//                         {/* Supplier Selection for Category Managers */}
//                         <CardContent className=" ">
//                             {user?.role === 'CATEGORY_MANAGER' && <SupplierSelection />}
//                             <CategorySelection
//                                 onCategorySelect={setSelectedCategoryCallback}
//                                 selectedCategory={selectedCategory}
//                             />
//                         </CardContent>
//                     </Card>
//                     {/* Main booking interface */}
//                     {/* <MacrozoneSelection selectedCategory={selectedCategory} /> */}
//                     {selectedCategory.length > 0}
//                 </div>
//             </main>
//         </div>
//     );
// }
