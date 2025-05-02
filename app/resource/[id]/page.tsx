import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const supabase = createClient()
  const { data: resource } = await supabase.from("resources").select("title, description").eq("id", params.id).single()

  if (!resource) {
    return {
      title: "Ресурс не найден | Библиотечка",
    }
  }

  return {
    title: `${resource.title} | Библиотечка`,
    description: resource.description || `Подробная информация о ресурсе ${resource.title}`,
  }
}

export default async function ResourcePage({ params }) {
  const supabase = createClient()

  const { data: resource, error } = await supabase.from("resources").select("*").eq("id", params.id).single()

  if (error || !resource) {
    notFound()
  }

  // Исправленный код для формирования URL скриншота
  const screenshotUrl = resource.row_number
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${resource.row_number}.webp`
    : resource.screenshot_url || "/placeholder.svg?height=630&width=1200"

  // Create an array of URLs from the resource
  const urls = []
  for (let i = 1; i <= 5; i++) {
    if (resource[`url_${i}`] && resource[`url_title_${i}`]) {
      urls.push({
        title: resource[`url_title_${i}`],
        url: resource[`url_${i}`],
      })
    }
  }

  return (
    <main className="container mx-auto py-10 px-4 max-w-4xl">
      <Link
        href={`/group/${encodeURIComponent(resource.group_name)}`}
        className="flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад к группе {resource.group_name}
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{resource.title}</h1>
          {resource.description && <p className="text-xl text-muted-foreground">{resource.description}</p>}
        </div>

        <div className="rounded-lg overflow-hidden border">
          <Image
            src={screenshotUrl || "/placeholder.svg"}
            alt={resource.title}
            width={1200}
            height={630}
            className="w-full h-auto"
            unoptimized // Добавляем это для обхода проблем с внешними изображениями
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resource.author && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Автор</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{resource.author}</p>
              </CardContent>
            </Card>
          )}

          {(resource.start_date || resource.end_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Даты</CardTitle>
              </CardHeader>
              <CardContent>
                {resource.start_date && <p>Начало: {formatDate(resource.start_date)}</p>}
                {resource.end_date && <p>Окончание: {formatDate(resource.end_date)}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ссылки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {urls.map((url, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-1">{url.title}</h3>
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {url.url}
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{resource.group_name}</Badge>
          {resource.subgroup_name && <Badge variant="outline">{resource.subgroup_name}</Badge>}
        </div>
      </div>
    </main>
  )
}
