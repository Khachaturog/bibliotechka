import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientResourcePage } from "../../resource/[id]/client-page"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const { slug, resourceSlug } = params
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

    // Затем ищем ресурс по slug
    const { data: resource, error } = await supabase
      .from("resources")
      .select("id, title, description, group_name")
      .eq("slug", resourceSlug)
      .single()

    if (error || !resource) {
      // Если ресурс не найден по slug, пробуем найти по ID (для обратной совместимости)
      const { data: resourceById, error: idError } = await supabase
        .from("resources")
        .select("title, description, group_name")
        .eq("id", resourceSlug)
        .single()

      if (idError || !resourceById) {
        return {
          title: "Ресурс не найден | Библиотечка",
        }
      }

      // Проверяем, что ресурс принадлежит запрашиваемой группе
      if (resourceById.group_name !== groupTranslation.original_name) {
        return {
          title: "Ресурс не найден | Библиотечка",
        }
      }

      return {
        title: `${resourceById.title} | Библиотечка`,
        description: resourceById.description || `Подробная информация о ресурсе ${resourceById.title}`,
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
  const { slug, resourceSlug } = params
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

  // Ищем ресурс по slug
  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, group_name")
    .eq("slug", resourceSlug)
    .single()

  if (error || !resource) {
    // Если ресурс не найден по slug, пробуем найти по ID (для обратной совместимости)
    const { data: resourceById, error: idError } = await supabase
      .from("resources")
      .select("id, group_name")
      .eq("id", resourceSlug)
      .single()

    if (idError || !resourceById) {
      notFound()
    }

    // Проверяем, что ресурс принадлежит запрашиваемой группе
    if (resourceById.group_name !== groupTranslation.original_name) {
      notFound()
    }

    return <ClientResourcePage resourceId={resourceById.id} groupSlug={slug} />
  }

  // Проверяем, что ресурс принадлежит запрашиваемой группе
  if (resource.group_name !== groupTranslation.original_name) {
    notFound()
  }

  return <ClientResourcePage resourceId={resource.id} groupSlug={slug} />
}
