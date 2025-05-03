"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@/utils/supabase/client"
import { createSeoUrl } from "@/lib/utils"

export function ResourceCard({ resource }) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [groupSlug, setGroupSlug] = useState("")

  // Получаем slug группы при монтировании компонента
  useEffect(() => {
    const fetchGroupSlug = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from("group_translations")
          .select("slug")
          .eq("original_name", resource.group_name)
          .single()

        if (!error && data) {
          setGroupSlug(data.slug)
        } else {
          // Если перевод не найден, используем закодированное имя группы
          setGroupSlug(encodeURIComponent(resource.group_name))
        }
      } catch (err) {
        console.error("Error fetching group slug:", err)
      }
    }

    fetchGroupSlug()
  }, [resource.group_name])

  // Формируем URL скриншота на основе row_number, если он есть
  const screenshotUrl = resource.row_number
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${resource.row_number}.webp`
    : resource.screenshot_url || "/placeholder.svg?height=200&width=400"

  const handleClick = () => {
    if (groupSlug) {
      // Создаем SEO-дружественный URL
      const seoUrl = createSeoUrl(resource.title, resource.short_id)
      router.push(`/${groupSlug}/${seoUrl}`)
    }
  }

  return (
    <Card
      className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
      onClick={handleClick}
    >
      {!imageError ? (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={screenshotUrl || "/placeholder.svg"}
            alt={resource.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      ) : (
        <div className="bg-muted aspect-video flex items-center justify-center">
          <span className="text-muted-foreground">Нет изображения</span>
        </div>
      )}

      <CardHeader className="flex-grow p-3 md:p-4">
        <CardTitle className="text-sm md:text-base line-clamp-2">{resource.title}</CardTitle>
      </CardHeader>

      {resource.description && (
        <CardContent className="pt-0 p-3 md:p-4">
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
        </CardContent>
      )}
    </Card>
  )
}
