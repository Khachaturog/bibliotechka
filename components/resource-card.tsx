"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { createSeoUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Archive, Clock, AlertTriangle } from "lucide-react"
import { STATUSES } from "@/utils/supabase/types"

export function ResourceCard({ resource }) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  // Обновляем компонент ResourceCard для использования slug вместо id и row_number

  // Формируем URL скриншота на основе slug, если он есть
  const screenshotUrl = resource.slug
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${resource.slug}.webp`
    : "/placeholder.svg?height=200&width=400"

  const handleClick = () => {
    // Используем group_slug для URL
    const groupSlug = resource.group_slug

    // Создаем SEO-дружественный URL из заголовка и slug ресурса
    const seoUrl = createSeoUrl(resource.title, resource.slug.toString())

    router.push(`/${groupSlug}/${seoUrl}`)
  }

  // Используем AI-описание, если оно доступно, иначе обычное описание
  const displayDescription = resource.description_ai || resource.description

  // Определяем, нужно ли показывать индикатор статуса
  const isArchived = resource.status_slug === STATUSES.ARCHIVED
  const isTrash = resource.status_slug === STATUSES.TRASH
  const isComingSoon = resource.status_slug === STATUSES.COMING_SOON
  const isAvailable = resource.status_slug === STATUSES.AVAILABLE

  // Определяем стили в зависимости от статуса
  const cardStyles = `h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col ${
    isArchived || isTrash ? "opacity-70" : ""
  }`

  const imageStyles = `object-cover ${isArchived || isTrash ? "grayscale" : ""}`

  return (
    <Card className={cardStyles} onClick={handleClick}>
      {!imageError ? (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={screenshotUrl || "/placeholder.svg"}
            alt={resource.title}
            fill
            className={imageStyles}
            onError={() => setImageError(true)}
            unoptimized
          />
          {(isArchived || isTrash || isComingSoon || isAvailable) && (
            <div className="absolute top-2 right-2">
              {isArchived && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  Архив
                </Badge>
              )}
              {isTrash && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Корзина
                </Badge>
              )}
              {isComingSoon && (
                <Badge variant="outline" className="flex items-center gap-1 bg-orange-100">
                  <Clock className="h-3 w-3" />
                  Скоро
                </Badge>
              )}
              {isAvailable && (
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-100">
                  Свободно
                </Badge>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted aspect-video flex items-center justify-center">
          <span className="text-muted-foreground">Нет изображения</span>
        </div>
      )}

      <CardHeader className="flex-grow p-3 md:p-4">
        <CardTitle className="text-sm md:text-base line-clamp-2">{resource.title_ai || resource.title}</CardTitle>
      </CardHeader>

      {displayDescription && (
        <CardContent className="pt-0 p-3 md:p-4">
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{displayDescription}</p>
        </CardContent>
      )}

      {(isArchived || isTrash || isComingSoon || isAvailable) && (
        <CardFooter className="p-3 md:p-4 pt-0">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isArchived && (
              <>
                <Archive className="h-3 w-3" />
                Архивный ресурс
              </>
            )}
            {isTrash && (
              <>
                <AlertTriangle className="h-3 w-3" />В корзине
              </>
            )}
            {isComingSoon && (
              <>
                <Clock className="h-3 w-3" />
                Скоро на портале
              </>
            )}
            {isAvailable && "Свободное место"}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
