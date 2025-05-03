"use client"

import { useYandexMetrika } from "@/hooks/use-yandex-metrika"

export default function AnalyticsProvider({ children }) {
  // Используем хук для отслеживания переходов между страницами
  useYandexMetrika()

  return <>{children}</>
}
