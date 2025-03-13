export const categoryData = [
  {
    category: "Консервация",
    correspondingMacrozones: [
      "Бакалея (мука, крупы, макароны)",
      "Бакалея (специи, масло, соусы)",
      "Замороженные полуфабрикаты",
      "Мясная гастрономия",
      "Рыбная продукция",
    ],
  },
  {
    category: "СОФ",
    correspondingMacrozones: ["Напитки", "Снеки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Замороженные полуфабрикаты",
    correspondingMacrozones: ["Бакалея (специи, масло, соусы)", "Консервация", "Снеки", "Напитки", "Кулинария (Food to go)"],
  },
  {
    category: "Сыры",
    correspondingMacrozones: ["Кулинария (Food to go)", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Хлебопродукты",
    correspondingMacrozones: [
      "Кулинария (Food to go)",
      "Мясная гастрономия",
      "Консервация",
      "Мороженое",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Бакалея (специи, масло, соусы)",
      "Замороженные полуфабрикаты",
      "Кондитерские изделия",
      "Молочная продукция",
      "Сыры",
      "Рыбная продукция",
      "Напитки",
    ],
  },
  {
    category: "Рыбная продукция",
    correspondingMacrozones: ["Напитки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Напитки",
    correspondingMacrozones: [
      "Снеки",
      "Кулинария (Food to go)",
      "Мясная гастрономия",
      "Консервация",
      "Мороженое",
      "Хлебопродукты",
      "Бакалея (мука, крупы, макароны)",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Бакалея (специи, масло, соусы)",
      "Замороженные полуфабрикаты",
      "Кондитерские изделия",
      "Молочная продукция",
      "Сыры",
      "Рыбная продукция",
    ],
  },
  {
    category: "Кулинария (Food to go)",
    correspondingMacrozones: [
      "Напитки",
      "Снеки",
      "Кондитерские изделия",
      "Чай, кофе",
      "Консервация",
      "Хлебопродукты",
      "ЗОЖ",
      "СОФ",
    ],
  },
  {
    category: "Мясо и яйца",
    correspondingMacrozones: ["Напитки", "Бакалея (специи, масло, соусы)"],
  },
  {
    category: "Бакалея",
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
    category: "Шоколадно-конфетные изделия",
    correspondingMacrozones: [
      "Напитки",
      "Чай, Кофе",
      "Бакалея (сахар, джем, мед, сгущенка, сухой завтрак)",
      "Мороженое",
      "Молочная продукция",
      "Хлебопродукция",
    ],
  },
]

export const getCategories = () => categoryData.map((item) => item.category)

export const getCorrespondingMacrozones = (category: string) => {
  const categoryItem = categoryData.find((item) => item.category === category)
  return categoryItem ? categoryItem.correspondingMacrozones : []
}
