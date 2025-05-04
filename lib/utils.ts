import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "Не указано"

  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Функция для создания безопасных ID из строк
export function createSafeId(text: string): string {
  if (!text) return ""

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

// Обновляем функции для работы с числовыми slug вместо строковых id

// Функция для создания SEO-дружественного URL
export function createSeoUrl(title: string, slug: string): string {
  if (!title || !slug) return slug || ""

  // Создаем безопасный slug из заголовка
  const safeSlug = createSafeId(title)

  // Ограничиваем длину slug до 50 символов для предотвращения слишком длинных URL
  const truncatedSlug = safeSlug.length > 50 ? safeSlug.substring(0, 50).replace(/-+$/, "") : safeSlug

  // Возвращаем slug с добавленным числовым идентификатором
  return `${truncatedSlug}-${slug}`
}

// Функция для извлечения числового slug из SEO-дружественного URL
export function extractId(seoUrl: string): string {
  if (!seoUrl) return ""

  // Извлекаем последнюю часть URL после последнего дефиса
  const parts = seoUrl.split("-")
  return parts[parts.length - 1]
}
