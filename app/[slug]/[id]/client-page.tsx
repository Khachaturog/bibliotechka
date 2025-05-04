"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, createSafeId } from "@/lib/utils"
import { STATUSES } from "@/utils/supabase/types"

// Добавим импорт иконок
import { ChevronLeft, Archive, AlertTriangle, Clock } from "lucide-react"

// Обновим функцию ClientResourcePage, добавив отображение статуса
export function ClientResourcePage({ resource, group, subsubgroup, status }) {
  const [imageError, setImageError] = useState(false)

  // Обновляем компонент для использования slug вместо id и row_number

  // Формируем URL скриншота на основе slug, если он есть
  const screenshotUrl = resource.slug
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${resource.slug}.webp`
    : "/placeholder.svg?height=630&width=1200"

  // Создаем массив URL из полей ресурса
  const urls = []
  for (let i = 1; i <= 5; i++) {
    if (resource[`url_${i}`] && resource[`url_title_${i}`]) {
      urls.push({
        title: resource[`url_title_${i}`],
        url: resource[`url_${i}`],
      })
    }
  }

  // Используем AI-поля, если они доступны
  const displayTitle = resource.title_ai || resource.title
  const displayDescription = resource.description_ai || resource.description
  const displayAuthor = resource.author_ai || resource.author

  // Определяем статус ресурса
  const isArchived = resource.status_slug === STATUSES.ARCHIVED
  const isTrash = resource.status_slug === STATUSES.TRASH
  const isComingSoon = resource.status_slug === STATUSES.COMING_SOON
  const isAvailable = resource.status_slug === STATUSES.AVAILABLE

  return (
    <main className="container mx-auto py-10 px-4 max-w-4xl">
      <Link href={`/${group.slug}`} className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Вернуться назад
      </Link>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{displayTitle}</h1>
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
                Скоро на портале
              </Badge>
            )}
            {isAvailable && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-100">
                Свободное место
              </Badge>
            )}
          </div>
          {displayDescription && <p className="text-xl text-muted-foreground">{displayDescription}</p>}
        </div>

        <div className="rounded-lg overflow-hidden border">
          {!imageError ? (
            <Image
              src={screenshotUrl || "/placeholder.svg"}
              alt={displayTitle}
              width={1200}
              height={630}
              className={`w-full h-auto ${isArchived || isTrash ? "grayscale" : ""}`}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="bg-muted aspect-video flex items-center justify-center">
              <span className="text-muted-foreground">Нет изображения</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayAuthor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Автор</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{displayAuthor}</p>
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

        {resource.summary_ai && (
          <Card>
            <CardHeader>
              <CardTitle>Краткое содержание</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{resource.summary_ai}</p>
            </CardContent>
          </Card>
        )}

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

        {resource.comment && (
          <Card>
            <CardHeader>
              <CardTitle>Комментарий</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{resource.comment}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href={`/${group.slug}`}>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {group.display_name || group.slug}
            </Badge>
          </Link>
          {resource.subgroup_slug && (
            <Link href={`/${group.slug}#${createSafeId(resource.subgroup_slug)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {resource.subgroup_slug}
              </Badge>
            </Link>
          )}
          {subsubgroup && <Badge variant="outline">{subsubgroup.display_name}</Badge>}
        </div>
      </div>
    </main>
  )
}

export default ClientResourcePage
