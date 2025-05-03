"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function useYandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ym) {
      // Отправляем данные о просмотре страницы в Яндекс Метрику
      ;(window as any).ym(101553574, "hit", window.location.href)
    }
  }, [pathname, searchParams])
}
