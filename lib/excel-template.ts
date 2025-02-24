import * as XLSX from "xlsx"
import type { ZoneData } from "@/types/zone"

export function generateExcelTemplate() {
  // Создаем пример данных
  const sampleData: Partial<ZoneData>[] = [
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
  ]

  // Создаем новую книгу Excel
  const workbook = XLSX.utils.book_new()

  // Создаем лист с данными
  const worksheet = XLSX.utils.json_to_sheet(sampleData)

  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, "Зоны")

  // Генерируем бинарные данные
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

