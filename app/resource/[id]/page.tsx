import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientResourcePage } from "./client-page"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const supabase = createClient()

  try {
    const { data: resource, error } = await supabase
      .from("resources")
      .select("title, description, group_name")
      .eq("id", params.id)
      .single()

    if (error || !resource) {
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
  // Проверяем, что ID имеет правильный формат UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
    console.error("Invalid UUID format:", params.id)
    notFound()
  }

  return <ClientResourcePage resourceId={params.id} />
}
