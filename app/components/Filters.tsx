// 'use client';

// import { useEffect, useMemo } from 'react';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import AdditionalFilters from './AdditionalFilters';
// import { getCategories, getCorrespondingMacrozones } from '@/lib/filterData';
// import { useGlobalStore } from '@/lib/store';

// export default function Filters() {
//     const { filters, setFilters, step, setStep, fetchZonesFromDB } = useGlobalStore();

//     const categories = useMemo(() => getCategories(), []);
//     const correspondingMacrozones = useMemo(() => {
//         return filters.category ? getCorrespondingMacrozones(filters.category) : [];
//     }, [filters.category]);

//     useEffect(() => {
//         if (filters.macrozone && step >= 2) {
//             fetchZonesFromDB();
//         }
//     }, [filters.macrozone, step, fetchZonesFromDB]);

//     const handleFilterChange = <T extends keyof typeof filters>(key: T, value: typeof filters[T]) => {
//         const newFilters = { ...filters, [key]: value };
//         if (key === 'category') {
//             const macrozonesForCategory = getCorrespondingMacrozones(value as string); // Получаем макрозоны для категории
//             fetchZonesFromDB(macrozonesForCategory); // Загружаем зоны по макрозонам
//             newFilters.macrozone = []; // Очищаем фильтр макрозон
//             setStep(2);
//         }
//         setFilters(newFilters);
//     };

//     return (
//         <div className="space-y-6 mb-8">
//             <div className="p-6 bg-muted rounded-lg">
//                 {step >= 1 && (
//                     <div className="mb-6">
//                         <h3 className="text-lg font-semibold mb-2">
//                             Шаг 1: Выберите категорию товаров
//                         </h3>
//                         <Select
//                             onValueChange={value => handleFilterChange('category', value)}
//                             value={filters.category}
//                         >
//                             <SelectTrigger className="w-[250px]">
//                                 <SelectValue placeholder="Выберите категорию" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {categories.map(category => (
//                                     <SelectItem
//                                         key={category}
//                                         value={category}
//                                     >
//                                         {category}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 )}

//                 {step >= 2 && (
//                     <div className="mb-6">
//                         <h3 className="text-lg font-semibold mb-2">Шаг 2: Выберите макрозону</h3>
//                         <div className="flex flex-wrap gap-2">
//                             {correspondingMacrozones.map(macrozone => (
//                                 <Button
//                                     key={macrozone}
//                                     variant={filters.macrozone.includes(macrozone) ? "default" : "outline"}
//                                     onClick={() => {
//                                         let newMacrozones = [...filters.macrozone];
//                                         if (newMacrozones.includes(macrozone)) {
//                                             newMacrozones = newMacrozones.filter(mz => mz !== macrozone);
//                                         } else {
//                                             newMacrozones.push(macrozone);
//                                         }
//                                         handleFilterChange('macrozone', newMacrozones);
//                                     }}
//                                 >
//                                     {macrozone}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {step >= 2 && (
//                     <div>
//                         <h3 className="text-lg font-semibold mb-2">Дополнительные фильтры</h3>
//                         <AdditionalFilters />
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
