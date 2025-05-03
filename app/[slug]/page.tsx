import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientGroupPage } from "./client-page"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const slug = params.slug
  const supabase = createClient()

  // Получаем перевод группы по slug
  const { data: translation, error } = await supabase.from("group_translations").select("*").eq("slug", slug).single()

  if (error || !translation) {
    // Если перевод не найден, пробуем найти группу по оригинальному имени
    // (для обратной совместимости со старыми URL)
    const decodedName = decodeURIComponent(slug)
    const { data: resources } = await supabase
      .from("resources")
      .select("group_name")
      .eq("group_name", decodedName)
      .limit(1)

    if (!resources || resources.length === 0) {
      return {
        title: "Группа не найдена | Библиотечка",
        description: "Запрашиваемая группа не существует или была удалена",
      }
    }

    return {
      title: `${decodedName} | Библиотечка`,
      description: `Коллекция ресурсов в группе ${decodedName}`,
    }
  }

  return {
    title: `${translation.display_name} | Библиотечка`,
    description: translation.description || `Коллекция ресурсов в группе ${translation.display_name}`,
  }
}

export default async function GroupPage({ params }) {
  const slug = params.slug
  const supabase = createClient()

  // Получаем перевод группы по slug
  const { data: translation, error } = await supabase.from("group_translations").select("*").eq("slug", slug).single()

  let groupName
  let displayName

  if (error || !translation) {
    // Если перевод не найден, пробуем найти группу по оригинальному имени
    // (для обратной совместимости со старыми URL)
    const decodedName = decodeURIComponent(slug)
    const { data: resources } = await supabase
      .from("resources")
      .select("group_name")
      .eq("group_name", decodedName)
      .limit(1)

    if (!resources || resources.length === 0) {
      notFound()
    }

    groupName = decodedName
    displayName = decodedName
  } else {
    groupName = translation.original_name
    displayName = translation.display_name
  }

  return <ClientGroupPage initialGroupName={groupName} initialDisplayName={displayName} />
}
