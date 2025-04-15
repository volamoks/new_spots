import fs from 'fs';
import path from 'path';

const iniFilePath = path.join(__dirname, '../lib/brands.ini');
const tsFilePath = path.join(__dirname, '../lib/constants/brands.ts');

console.log(`Reading brands from: ${iniFilePath}`);
console.log(`Writing constants to: ${tsFilePath}`);

try {
  // Читаем ini файл
  const iniContent = fs.readFileSync(iniFilePath, 'utf-8');

  // Разбиваем на строки, убираем пустые строки и лишние пробелы
  const brandNames = iniContent
    .split(/\r?\n/) // Разделяем по строкам (Windows/Unix)
    .map(line => line.trim()) // Убираем пробелы по краям
    .filter(line => line.length > 0); // Убираем пустые строки

  console.log(`Found ${brandNames.length} brand names.`);

  // Формируем массив объектов
  const brandObjects = brandNames.map(name => ({
    // Используем имя как ID, экранируем обратные кавычки и слеши, если они есть
    id: name.replace(/\\/g, '\\\\').replace(/`/g, '\\`'),
    name: name.replace(/\\/g, '\\\\').replace(/`/g, '\\`'),
  }));

  // Формируем содержимое TS файла
  const tsContent = `// Список брендов для быстрого поиска на клиенте
// Сгенерировано из lib/brands.ini скриптом scripts/generate-brand-constants.ts
// Дата генерации: ${new Date().toISOString()}

interface BrandOption {
  id: string;
  name: string;
}

export const BRANDS: BrandOption[] = ${JSON.stringify(brandObjects, null, 2)};
`;

  // Записываем TS файл
  fs.writeFileSync(tsFilePath, tsContent, 'utf-8');

  console.log(`Successfully generated ${tsFilePath}`);

} catch (error) {
  console.error('Error generating brand constants:', error);
  process.exit(1); // Выход с ошибкой
}