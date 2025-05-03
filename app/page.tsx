import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { GroupSkeleton } from "@/components/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const revalidate = 3600 // Revalidate every hour

async function GroupsList() {
  try {
    const supabase = createClient()

    // Получаем все уникальные группы из основной таблицы
    // Изменяем запрос, чтобы не использовать колонку id
    const { data: resourceGroups, error: resourceError } = await supabase
      .from("resources")
      .select("group_name")
      .order("group_name")

    if (resourceError) {
      console.error("Error fetching resource groups:", resourceError)
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>Не удалось загрузить группы. Пожалуйста, попробуйте позже.</AlertDescription>
        </Alert>
      )
    }

    // Проверяем, что resourceGroups существует и не пустой
    if (!resourceGroups || resourceGroups.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Пока нет доступных групп.</p>
        </div>
      )
    }

    // Подсчитываем количество ресурсов в каждой группе
    const groupCounts = resourceGroups.reduce((acc, { group_name }) => {
      acc[group_name] = (acc[group_name] || 0) + 1
      return acc
    }, {})

    // Получаем уникальные имена групп
    const uniqueGroupNames = [...new Set(resourceGroups.map((item) => item.group_name))]

    // Получаем переводы для групп
    const { data: translations, error: translationsError } = await supabase
      .from("group_translations")
      .select("*")
      .in("original_name", uniqueGroupNames)

    if (translationsError) {
      console.error("Error fetching group translations:", translationsError)
    }

    // Создаем словарь переводов
    const translationsMap = (translations || []).reduce((acc, translation) => {
      acc[translation.original_name] = translation
      return acc
    }, {})

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueGroupNames.map((groupName) => {
          const translation = translationsMap[groupName] || {
            display_name: groupName,
            slug: encodeURIComponent(groupName),
            cover_url: null,
          }

          const coverUrl =
            translation.cover_url ||
            "/placeholder.svg?height=200&width=400&text=" + encodeURIComponent(translation.display_name)
          const slug = translation.slug || encodeURIComponent(groupName)
          const count = groupCounts[groupName] || 0

          return (
            <Link href={`/${slug}`} key={groupName}>
              <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={coverUrl || "/placeholder.svg"}
                    alt={translation.display_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-2">{translation.display_name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  </div>
                  {translation.description && (
                    <span className="block mt-1 text-sm text-muted-foreground line-clamp-2">
                      {translation.description}
                    </span>
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

      <Suspense fallback={<GroupSkeleton />}>
        <GroupsList />
      </Suspense>
    </main>
  )
}
