import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientResourcePage } from "./client-page"
import { extractId } from "@/lib/utils"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const { slug, id } = params
  const supabase = createClient()

  try {
    // Проверяем, существует ли группа с таким slug
    const { data: group, error: groupError } = await supabase.from("groups").select("*").eq("slug", slug).single()

    if (groupError) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    // Обновляем функцию для использования slug вместо id

    // Извлекаем slug из SEO-дружественного URL
    const resourceSlug = Number.parseInt(extractId(id))

    // Ищем ресурс по slug
    const { data: resource, error } = await supabase
      .from("resources")
      .select("title, title_ai, description, description_ai, group_slug, status_slug")
      .eq("slug", resourceSlug)
      .single()

    if (error || !resource) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    // Проверяем, что ресурс принадлежит запрашиваемой группе
    if (resource.group_slug !== group.slug) {
      return {
        title: "Ресурс не найден | Библиотечка",
      }
    }

    // Получаем информацию о статусе
    const { data: status } = await supabase.from("statuses").select("name").eq("slug", resource.status_slug).single()

    // Используем AI-заголовок, если он доступен
    const displayTitle = resource.title_ai || resource.title
    const displayDescription = resource.description_ai || resource.description

    return {
      title: `${displayTitle} | Библиотечка`,
      description: displayDescription || `Подробная информация о ресурсе ${displayTitle}`,
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
  const { data: group, error: groupError } = await supabase.from("groups").select("*").eq("slug", slug).single()

  if (groupError) {
    notFound()
  }

  // Обновляем функцию для использования slug вместо id

  // Извлекаем slug из SEO-дружественного URL
  const resourceSlug = Number.parseInt(extractId(id))

  // Ищем ресурс по slug
  const { data: resource, error } = await supabase.from("resources").select("*").eq("slug", resourceSlug).single()

  if (error || !resource) {
    notFound()
  }

  // Проверяем, что ресурс принадлежит запрашиваемой группе
  if (resource.group_slug !== group.slug) {
    notFound()
  }

  // Получаем информацию о статусе
  const { data: status } = await supabase.from("statuses").select("*").eq("slug", resource.status_slug).single()

  // Если у ресурса есть subsubgroup_slug, загружаем информацию о subsubgroup
  let subsubgroup = null
  if (resource.subsubgroup_slug) {
    const { data: subsubgroupData } = await supabase
      .from("subsubgroups")
      .select("*")
      .eq("slug", resource.subsubgroup_slug)
      .single()

    if (subsubgroupData) {
      subsubgroup = subsubgroupData
    }
  }

  return (
    <>
      <ClientResourcePage resource={resource} group={group} subsubgroup={subsubgroup} status={status} />
      {/* В отладочной информации */}
      <p>Resource Slug: {resource.slug}</p>
    </>
  )
}
