import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientResourcePage } from "../../resource/[id]/client-page"

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

    // Затем ищем ресурс по ID
    const { data: resource, error } = await supabase
      .from("resources")
      .select("title, description, group_name")
      .eq("id", id)
      .single()

    if (error || !resource) {
      // Если ресурс не найден по ID, пробуем найти по slug или short_id
      const { data: resourceBySlug, error: slugError } = await supabase
        .from("resources")
        .select("title, description, group_name")
        .or(`slug.eq.${id},short_id.eq.${id}`)
        .single()

      if (slugError || !resourceBySlug) {
        return {
          title: "Ресурс не найден | Библиотечка",
        }
      }

      // Проверяем, что ресурс принадлежит запрашиваемой группе
      if (resourceBySlug.group_name !== groupTranslation.original_name) {
        return {
          title: "Ресурс не найден | Библиотечка",
        }
      }

      return {
        title: `${resourceBySlug.title} | Библиотечка`,
        description: resourceBySlug.description || `Подробная информация о ресурсе ${resourceBySlug.title}`,
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

  // Сначала пробуем найти ресурс по UUID
  let resourceId = id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isUuid) {
    // Если это UUID, проверяем, что ресурс существует и принадлежит группе
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("group_name")
      .eq("id", id)
      .single()

    if (resourceError || !resource || resource.group_name !== groupTranslation.original_name) {
      notFound()
    }
  } else {
    // Если это не UUID, пробуем найти ресурс по slug или short_id
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, group_name")
      .or(`slug.eq.${id},short_id.eq.${id}`)
      .single()

    if (resourceError || !resource || resource.group_name !== groupTranslation.original_name) {
      notFound()
    }

    resourceId = resource.id
  }

  return <ClientResourcePage resourceId={resourceId} groupSlug={slug} />
}
