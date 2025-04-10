// Updated categoryData to align with KM_CATEGORY_MAP names
export const categoryData = [
  {
    category: "Прохладительные напитки и снеки", // Code: 1
    correspondingMacrozones: ["Напитки", "Снеки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Консервация, мед, варенье, снеки", // Code: 11
    correspondingMacrozones: ["Консервация", "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)", "Снеки"], // Example macrozones
  },
  {
    category: "Крупы, макаронные изделия, каши и специи", // Code: 19
    correspondingMacrozones: [
      "Консервация",
      "Бакалея (мука, крупы, макароны)",
      "Бакалея (специи, масло, соусы)",
      "Замороженные полуфабрикаты",
      "Мясная гастрономия",
      "Рыбная продукция",
    ],
  },
  {
    category: "Шоколадно-конфетные изделия", // Code: 7
    correspondingMacrozones: [
      "Напитки",
      "Чай, Кофе",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Мороженое",
      "Молочная продукция",
      "Хлебопродукты",
    ],
  },
  {
    category: "Чай, Кофе", // Code: 15
    correspondingMacrozones: [
      "Кондитерские изделия",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Хлебопродукты",
      "ЗОЖ",
      "Кулинария (Food to go)",
      "Чай, Кофе",
    ],
  },
  {
    category: "Мучные кондитерские изделия", // Code: 21
    correspondingMacrozones: ["Хлебопродукты", "Кондитерские изделия", "Чай, Кофе"], // Example macrozones
  },
  {
    category: "Товары для животных", // Code: 29
    correspondingMacrozones: ["Товары для животных"],
  },
  {
    category: "Кулинария", // Code: 28
    correspondingMacrozones: [
      "Напитки",
      "Снеки",
      "Кондитерские изделия",
      "Чай, Кофе",
      "Консервация",
      "Хлебопродукты",
      "ЗОЖ",
      "СОФ", // Assuming СОФ relates to "Прохладительные напитки и снеки" macrozones
    ],
  },
  {
    category: "Хлебопродукты, торты", // Code: 6
    correspondingMacrozones: [
      "Кулинария (Food to go)", // Keep original macrozone names for now
      "Мясная гастрономия",
      "Консервация",
      "Мороженое",
      "Хлебопродукты",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Бакалея (специи, масло, соусы)",
      "Замороженные полуфабрикаты",
      "Кондитерские изделия",
      "Молочная продукция",
      "Сыры",
      "Рыбная продукция",
      "Напитки",
      "Консервация",
    ],
  },
  {
    category: "ЗОЖ", // Code: 10
    correspondingMacrozones: ["ЗОЖ", "Напитки"],
  },
  {
    category: "Замороженные полуфабрикаты, салаты, мороженое", // Code: 2
    correspondingMacrozones: ["Бакалея (специи, масло, соусы)", "Консервация", "Снеки", "Напитки", "Кулинария (Food to go)"],
  },
  {
    category: "Колбасы и сосиски", // Code: 5
    correspondingMacrozones: ["Бакалея (специи, масло, соусы)", "Консервация", "Снеки", "Напитки", "Кулинария (Food to go)"],
  },
  {
    category: "Кисломолочные продукты", // Code: 14
    correspondingMacrozones: ["Кондитерские изделия", "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)"],
  },
  {
    category: "Сыры, масло и маргарин", // Code: 27
    correspondingMacrozones: ["Кулинария (Food to go)", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Дача, сад, прочая кухня", // Code: 3
    correspondingMacrozones: ["Товары для дома, текстиль и одежда"], // Example macrozones
  },
  {
    category: "Текстиль", // Code: 13
    correspondingMacrozones: ["Товары для дома, текстиль и одежда", "Чистящие и моющие средства", "Косметика и уход за телом"],
  },
  {
    category: "Детское питание, детская гигиена, игрушки", // Code: 9
    correspondingMacrozones: ["Детская гигиена", "Детское питание", "Молочная продукция", "Мороженое", "Кондитерские изделия"],
  },
  {
    category: "Чистящие и моющие средства", // Code: 16
    correspondingMacrozones: ["Товары для дома, текстиль и одежда", "Чистящие и моющие средства", "Косметика и уход за телом"],
  },
  {
    category: "Средства по уходу за телом", // Code: 20
    correspondingMacrozones: ["Товары для дома, текстиль и одежда", "Косметика и уход за телом"],
  },
  {
    category: "Мясо животных", // Code: 4
    correspondingMacrozones: ["Напитки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Рыбы свежие, морепродукты", // Code: 17
    correspondingMacrozones: ["Напитки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Овощи", // Code: 8
    correspondingMacrozones: ["Консервация", "Бакалея (специи, масло, соусы)"], // Example macrozones
  },
  {
    category: "Фрукты", // Code: 18
    correspondingMacrozones: ["Напитки", "Кондитерские изделия"], // Example macrozones
  },
];

export const getCategories = () => categoryData.map((item) => item.category);

export const getCorrespondingMacrozones = (category: string) => {
  const categoryItem = categoryData.find((item) => item.category.toLowerCase() === category.toLowerCase()); // Case-insensitive comparison
  return categoryItem ? categoryItem.correspondingMacrozones : [];
};
