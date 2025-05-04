import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientGroupPage } from "./client-page"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const slug = params.slug
  const supabase = createClient()

  // Получаем группу по slug
  const { data: group, error } = await supabase.from("groups").select("*").eq("slug", slug).single()

  if (error || !group) {
    return {
      title: "Группа не найдена | Библиотечка",
      description: "Запрашиваемая группа не существует или была удалена",
    }
  }

  return {
    title: `${group.display_name || group.slug} | Библиотечка`,
    description: group.description || `Коллекция ресурсов в группе ${group.display_name || group.slug}`,
  }
}

export default async function GroupPage({ params }) {
  const slug = params.slug
  const supabase = createClient()

  // Получаем группу по slug
  const { data: group, error } = await supabase.from("groups").select("*").eq("slug", slug).single()

  if (error || !group) {
    notFound()
  }

  return <ClientGroupPage group={group} />
}
