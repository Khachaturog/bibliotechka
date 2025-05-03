import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientResourcePage } from "./client-page"
import { extractShortId } from "@/lib/utils"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const { slug, id } = params
  const supabase = createClient()

  try {
    // Сначала проверяем, существует ли группа с таким slug
    const { data: groupTranslation, error: groupError } = await supabase
      .from("group_translations")
      .select("*")
      .eq("slug", slug)
      .single()

    if (groupError) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    // Извлекаем short_id из SEO-дружественного URL
    const shortId = extractShortId(id)

    // Ищем ресурс по short_id
    const { data: resource, error } = await supabase
      .from("resources")
      .select("title, description, group_name")
      .eq("short_id", shortId)
      .single()

    if (error || !resource) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    // Проверяем, что ресурс принадлежит запрашиваемой группе
    if (resource.group_name !== groupTranslation.original_name) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    return {
      title: `${resource.title} | Библиотечка`,
      description: resource.description || `Подробная информация о ресурсе ${resource.title}`,
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Ошибка | Библиотечка",
      description: "Произошла ошибка при загрузке ресурса",
    }
  }
}

export default async function ResourcePage({ params }) {
  const { slug, id } = params
  const supabase = createClient()

  // Проверяем, существует ли группа с таким slug
  const { data: groupTranslation, error: groupError } = await supabase
    .from("group_translations")
    .select("*")
    .eq("slug", slug)
    .single()

  if (groupError) {
    notFound()
  }

  // Извлекаем short_id из SEO-дружественного URL
  const shortId = extractShortId(id)

  // Ищем ресурс по short_id
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("short_id, group_name, title")
    .eq("short_id", shortId)
    .single()

  if (resourceError || !resource) {
    notFound()
  }

  // Проверяем, что ресурс принадлежит запрашиваемой группе
  if (resource.group_name !== groupTranslation.original_name) {
    notFound()
  }

  return <ClientResourcePage resourceId={resource.short_id} groupSlug={slug} />
}
