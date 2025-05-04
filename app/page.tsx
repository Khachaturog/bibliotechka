import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { GroupSkeleton } from "@/components/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUSES } from "@/utils/supabase/types"

export const revalidate = 3600 // Revalidate every hour

async function LatestUpdates() {
  // Компонент временно не отображает обновления
  return null
}

async function GroupsList() {
  try {
    const supabase = createClient()

    // Получаем все группы
    const { data: groups, error } = await supabase.from("groups").select("*").order("display_name")

    if (error) {
      console.error("Error fetching groups:", error)
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>Не удалось загрузить группы. Пожалуйста, попробуйте позже.</AlertDescription>
        </Alert>
      )
    }

    // Проверяем, что groups существует и не пустой
    if (!groups || groups.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Пока нет доступных групп.</p>
        </div>
      )
    }

    // Создаем словарь для хранения количества ресурсов для каждой группы
    const countsMap = {}

    // Для каждой группы выполняем отдельный запрос для подсчета ресурсов
    for (const group of groups) {
      const { count, error: countError } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("group_slug", group.slug)
        .eq("status_slug", STATUSES.PUBLISHED) // Считаем только опубликованные ресурсы

      if (countError) {
        console.error(`Error counting resources for group ${group.slug}:`, countError)
        countsMap[group.slug] = 0
      } else {
        countsMap[group.slug] = count || 0
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const count = countsMap[group.slug] || 0
          const coverUrl =
            group.cover_url ||
            "/placeholder.svg?height=200&width=400&text=" + encodeURIComponent(group.display_name || group.slug)

          return (
            <Link href={`/${group.slug}`} key={group.slug}>
              <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={coverUrl || "/placeholder.svg"}
                    alt={group.display_name || group.slug}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-2">{group.display_name || group.slug}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  </div>
                  {group.description && (
                    <span className="block mt-1 text-sm text-muted-foreground line-clamp-2">{group.description}</span>
                  )}
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in GroupsList:", error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.</AlertDescription>
      </Alert>
    )
  }
}

export default function HomePage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-2">Библиотечка</h1>
      <p className="text-muted-foreground mb-10">Коллекция полезных ресурсов и материалов</p>

      <h2 className="text-2xl font-semibold mb-6">Все категории</h2>
      <Suspense fallback={<GroupSkeleton />}>
        <GroupsList />
      </Suspense>
    </main>
  )
}
