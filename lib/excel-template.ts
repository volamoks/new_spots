import * as XLSX from "xlsx"
// import type { ZoneData } from "@/types/zone" // Removed unused import

// Remove the separate generateInnTemplate function

export function generateExcelTemplate(type: 'zones' | 'inn' | 'brands') {
  let sampleData: any[] = [];
  let sheetName: string = 'Sheet1';

  if (type === 'zones') {
    sheetName = 'Зоны';
    // Sample data for zones
    sampleData = [
      {
        Область: "Ташкентская обл.",
        Город: "Ташкент",
        "№": "K001",
        Маркет: "Korzinka Example",
        "Формат маркета": "Large",
        "Формат оборудования": "New",
        Оборудование: "Паллета",
        Цена: 100000,
        ID: "P-1",
        Габариты: "120*80",
        "Уникальный идентификатор": "K001P-1",
        Сектор: "DRY",
        КМ: "1",
        "Основная Макрозона": "Напитки",
        "Смежная макрозона": "Снеки/Кондитерские изделия",
        "Товарное соседство ДМП": "Категория напитки",
        Назначение: "Коммерческое",
        Подназначение: "Коммерческое",
        Категория: "Food",
        Поставщик: "ООО Пример",
        Brand: "Example Brand",
        "Категория товара": "Напитки",
        Статус: "Свободно",
      },
      // Add more sample zone rows if needed
    ];
  } else if (type === 'inn') {
    sheetName = 'ИНН';
    // Sample data for INN
    sampleData = [
      {
        "Поставщик": "ИП ООО Lachatte Central Asia",
        "Налоговый номер": "303146221"
      },
      {
        "Поставщик": "ООО UNITED DISTRIBUTION",
        "Налоговый номер": "307094349"
      }
    ];
  } else if (type === 'brands') {
    sheetName = 'Бренды';
    // Sample data for Brands
    sampleData = [
      {
        "Название Бренда": "Example Brand A",
        "ИНН Поставщика": "303146221" // Optional INN
      },
      {
        "Название Бренда": "Example Brand B",
        "ИНН Поставщика": "" // Optional INN - empty
      },
      {
        "Название Бренда": "Example Brand C (No INN)",
        // "ИНН Поставщика": null // Optional INN - null/undefined
      }
    ];
  } else {
    // Default or throw error for unknown type
    sampleData = [{ "Error": "Unknown template type requested" }];
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  // Return Blob
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
