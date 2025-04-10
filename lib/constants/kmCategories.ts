// lib/constants/kmCategories.ts

// Define the map with updated codes (no leading zeros)
export const KM_CATEGORY_MAP: Record<string, string> = {
  "1": "Прохладительные напитки и снеки",
  "11": "Консервация, мед, варенье, снеки",
  "19": "Крупы, макаронные изделия, каши и специи",
  "7": "Шоколадно-конфетные изделия",
  "15": "Чай, Кофе",
  "21": "Мучные кондитерские изделия",
  "29": "Товары для животных",
  "28": "Кулинария",
  "6": "Хлебопродукты, торты",
  "10": "ЗОЖ",
  "2": "Замороженные полуфабрикаты, салаты, мороженое",
  "5": "Колбасы и сосиски",
  "14": "Кисломолочные продукты",
  "27": "Сыры, масло и маргарин",
  "3": "Дача, сад, прочая кухня",
  "13": "Текстиль",
  "9": "Детское питание, детская гигиена, игрушки",
  "16": "Чистящие и моющие средства",
  "20": "Средства по уходу за телом",
  "4": "Мясо животных",
  "17": "Рыбы свежие, морепродукты",
  "8": "Овощи",
  "18": "Фрукты",
};

// Derive the array for dropdowns using the updated map
export const CATEGORIES = Object.entries(KM_CATEGORY_MAP).map(([code, name]) => ({
  code, // This will now be the code without leading zeros
  name,
}));

// Derive the reverse map using the updated map
export const CATEGORY_KM_MAP: Record<string, string> = Object.entries(
  KM_CATEGORY_MAP
).reduce((acc, [code, name]) => {
  acc[name] = code; // Store code without leading zeros
  return acc;
}, {} as Record<string, string>);