"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, createSafeId } from "@/lib/utils"
import { createClientComponentClient } from "@/utils/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function ClientResourcePage({ resourceId, groupSlug }) {
  const router = useRouter()
  const [resource, setResource] = useState(null)
  const [groupInfo, setGroupInfo] = useState({ displayName: "", slug: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [urls, setUrls] = useState([])
  const [screenshotUrl, setScreenshotUrl] = useState("")

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const supabase = createClientComponentClient()

        const { data, error } = await supabase.from("resources").select("*").eq("short_id", resourceId).single()

        if (error) {
          throw error
        }

        if (data) {
          setResource(data)

          // Get group translation
          const { data: translation } = await supabase
            .from("group_translations")
            .select("display_name, slug")
            .eq("original_name", data.group_name)
            .single()

          setGroupInfo({
            displayName: translation?.display_name || data.group_name,
            slug: groupSlug,
          })

          // Create URLs array
          const resourceUrls = []
          for (let i = 1; i <= 5; i++) {
            if (data[`url_${i}`] && data[`url_title_${i}`]) {
              resourceUrls.push({
                title: data[`url_title_${i}`],
                url: data[`url_${i}`],
              })
            }
          }
          setUrls(resourceUrls)

          // Set screenshot URL
          setScreenshotUrl(
            data.row_number
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${data.row_number}.webp`
              : data.screenshot_url || "/placeholder.svg?height=630&width=1200",
          )
        }
      } catch (err) {
        console.error("Error fetching resource:", err)
        setError("Не удалось загрузить ресурс")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResource()
  }, [resourceId, groupSlug])

  if (isLoading) {
    return (
      <main className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          <div className="h-96 w-full bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto py-10 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (!resource) {
    return (
      <main className="container mx-auto py-10 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ресурс не найден</AlertTitle>
          <AlertDescription>Запрашиваемый ресурс не существует или был удален.</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-10 px-4 max-w-4xl">
      <Link href={`/${groupInfo.slug}`} className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Вернуться назад
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
            unoptimized
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
          <Link href={`/${groupInfo.slug}`}>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {groupInfo.displayName}
            </Badge>
          </Link>
          {resource.subgroup_name && (
            <Link href={`/${groupInfo.slug}#${createSafeId(resource.subgroup_name)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {resource.subgroup_name}
              </Badge>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}

export default ClientResourcePage
