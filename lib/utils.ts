import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

// Функция для создания безопасных ID из строк
export function createSafeId(text: string): string {
  // Заменяем кириллические символы на латинские (простая транслитерация)
  const translitMap: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  }

  // Преобразуем строку в нижний регистр и заменяем символы
  const transliterated = text
    .toLowerCase()
    .split("")
    .map((char) => {
      return translitMap[char] || char
    })
    .join("")

  // Заменяем все не-алфавитно-цифровые символы на дефисы и удаляем лишние дефисы
  return transliterated
    .replace(/[^a-z0-9]+/g, "-") // Заменяем не-алфавитно-цифровые символы на дефисы
    .replace(/^-+|-+$/g, "") // Удаляем дефисы в начале и конце строки
    .replace(/-+/g, "-") // Заменяем множественные дефисы на один
}
