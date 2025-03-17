declare module '@/lib/filterData' {
  export interface CategoryData {
    category: string;
    correspondingMacrozones: string[];
  }

  export const categoryData: CategoryData[];
  export function getCategories(): string[];
  export function getCorrespondingMacrozones(category: string): string[];
}