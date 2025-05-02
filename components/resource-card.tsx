"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function ResourceCard({ resource }) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  // Исправленный код для формирования URL скриншота
  const screenshotUrl = resource.row_number
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${resource.row_number}.webp`
    : resource.screenshot_url || "/placeholder.svg?height=200&width=400"

  const handleClick = () => {
    router.push(`/resource/${resource.id}`)
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
            unoptimized // Добавляем это для обхода проблем с внешними изображениями
          />
        </div>
      ) : (
        <div className="bg-muted aspect-video flex items-center justify-center">
          <span className="text-muted-foreground">Нет изображения</span>
        </div>
      )}

      <CardHeader className="flex-grow">
        <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
      </CardHeader>

      {resource.description && (
        <CardContent className="pt-0">
          <p className="text-muted-foreground line-clamp-2">{resource.description}</p>
        </CardContent>
      )}

      <CardFooter className="text-sm text-muted-foreground">
        {resource.author && `Автор: ${resource.author}`}
      </CardFooter>
    </Card>
  )
}
