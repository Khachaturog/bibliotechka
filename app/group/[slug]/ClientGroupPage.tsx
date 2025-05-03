"use client"

import { createClient } from "@/utils/supabase/server"
import { ResourceCard } from "@/components/resource-card"
import { Suspense } from "react"
import { ResourceSkeleton } from "@/components/skeletons"
import Link from "next/link"
import { ChevronLeft, RefreshCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createSafeId } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Временное решение - жестко закодированные группы для обхода ошибки "Too Many Requests"
const FALLBACK_GROUPS = ["Насмотренность", "Дизайн-система", "Тренажёры", "Сообщества", "Ресурсы"]

async function GroupLinks() {
  try {
    const supabase = createClient()

    try {
      // Получаем все уникальные группы
      const { data: groups, error } = await supabase.from("resources").select("group_name").order("group_name")

      if (error) {
        // Если ошибка содержит "Too Many Requests", используем резервные данные
        if (error.message?.includes("Too Many") || error.message?.includes("429")) {
          console.warn("Using fallback groups due to rate limiting")
          return renderGroupLinks(FALLBACK_GROUPS)
        }

        console.error("Error fetching groups:", error)
        return (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              Не удалось загрузить список групп. Пожалуйста, попробуйте позже.
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Обновить страницу
              </Button>
            </AlertDescription>
          </Alert>
        )
      }

      if (!groups || groups.length === 0) {
        return null
      }

      // Получаем уникальные имена групп
      const uniqueGroups = [...new Set(groups.map((item) => item.group_name))]
      return renderGroupLinks(uniqueGroups)
    } catch (error) {
      // Если произошла непредвиденная ошибка, используем резервные данные
      console.error("Unexpected error in GroupLinks:", error)
      return renderGroupLinks(FALLBACK_GROUPS)
    }
  } catch (error) {
    console.error("Critical error in GroupLinks:", error)
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>
          Произошла критическая ошибка. Пожалуйста, попробуйте позже.
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Обновить страницу
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
}

// Функция для рендеринга ссылок на группы
function renderGroupLinks(groups) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium mb-3">Другие группы:</h2>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <Link href={`/group/${encodeURIComponent(group)}`} key={group}>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {group}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Временное решение - жестко закодированные подгруппы для обхода ошибки "Too Many Requests"
const FALLBACK_RESOURCES = {
  Насмотренность: {
    "Графический дизайн": [
      {
        id: "1",
        title: "Behance - Лучшие проекты графического дизайна",
        description: "Коллекция выдающихся проектов по графическому дизайну со всего мира",
        row_number: 101,
      },
      {
        id: "2",
        title: "Dribbble - Вдохновение для дизайнеров",
        description: "Сообщество дизайнеров, делящихся своими работами и находящих вдохновение",
        row_number: 103,
      },
    ],
    "Веб-дизайн": [
      {
        id: "3",
        title: "Awwwards - Сайты с лучшим дизайном",
        description: "Платформа, отмечающая лучшие веб-проекты, созданные по всему миру",
        row_number: 102,
      },
    ],
    Разное: [
      {
        id: "4",
        title: "Pinterest - Коллекции визуального контента",
        description: "Платформа для поиска идей и вдохновения в различных областях дизайна",
        row_number: 104,
      },
    ],
  },
  "Дизайн-система": {
    Корпоративные: [
      {
        id: "5",
        title: "Material Design от Google",
        description: "Комплексная система дизайна для создания цифровых интерфейсов",
        row_number: 201,
      },
      {
        id: "6",
        title: "Apple Human Interface Guidelines",
        description: "Руководство по дизайну для создания приложений в экосистеме Apple",
        row_number: 202,
      },
    ],
    Инструменты: [
      {
        id: "7",
        title: "Figma Design System Kit",
        description: "Набор компонентов и стилей для создания собственной дизайн-системы в Figma",
        row_number: 203,
      },
    ],
    Обучение: [
      {
        id: "8",
        title: "Создание дизайн-системы с нуля",
        description: "Пошаговое руководство по созданию собственной дизайн-системы для продукта",
        row_number: 204,
      },
    ],
  },
  Тренажёры: {
    CSS: [
      { id: "9", title: "Flexbox Froggy", description: "Игра для изучения CSS Flexbox", row_number: 301 },
      { id: "10", title: "Grid Garden", description: "Интерактивная игра для изучения CSS Grid", row_number: 302 },
    ],
    JavaScript: [
      {
        id: "11",
        title: "TypeScript Playground",
        description: "Онлайн-среда для изучения и экспериментов с TypeScript",
        row_number: 303,
      },
    ],
    Дизайн: [
      { id: "12", title: "Figma Tutorials", description: "Интерактивные уроки по работе с Figma", row_number: 304 },
    ],
  },
  Сообщества: {
    Дизайн: [
      {
        id: "13",
        title: "Дизайн-сообщество Россия",
        description: "Крупнейшее русскоязычное сообщество дизайнеров",
        row_number: 401,
      },
    ],
    Разработка: [
      {
        id: "14",
        title: "Frontend Developer Community",
        description: "Международное сообщество фронтенд-разработчиков",
        row_number: 402,
      },
    ],
    Продукты: [
      {
        id: "15",
        title: "Product Hunt",
        description: "Сообщество для открытия и обсуждения новых продуктов",
        row_number: 403,
      },
    ],
    "UX дизайн": [
      { id: "16", title: "UX Collective", description: "Сообщество UX-дизайнеров и исследователей", row_number: 404 },
    ],
  },
  Ресурсы: {
    Фотографии: [
      {
        id: "17",
        title: "Unsplash - Бесплатные стоковые фотографии",
        description: "Коллекция высококачественных бесплатных фотографий",
        row_number: 501,
      },
    ],
    Типографика: [
      { id: "18", title: "Google Fonts", description: "Библиотека бесплатных шрифтов от Google", row_number: 502 },
    ],
    Иконки: [
      {
        id: "19",
        title: "Iconify - Библиотека иконок",
        description: "Универсальная платформа с более чем 100,000 векторных иконок",
        row_number: 503,
      },
    ],
    Цвета: [
      {
        id: "20",
        title: "Coolors - Генератор цветовых палитр",
        description: "Инструмент для создания и изучения цветовых схем",
        row_number: 504,
      },
    ],
  },
}

async function ResourcesList({ groupName }) {
  try {
    const supabase = createClient()

    try {
      const { data: resources, error } = await supabase
        .from("resources")
        .select("*")
        .eq("group_name", groupName)
        .order("subgroup_name", { ascending: true })
        .order("title", { ascending: true })

      if (error) {
        // Если ошибка содержит "Too Many Requests", используем резервные данные
        if (error.message?.includes("Too Many") || error.message?.includes("429")) {
          console.warn("Using fallback resources due to rate limiting")
          return renderResources(FALLBACK_RESOURCES[groupName] || {})
        }

        console.error("Error fetching resources:", error)
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              Не удалось загрузить ресурсы. Пожалуйста, попробуйте позже.
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Обновить страницу
              </Button>
            </AlertDescription>
          </Alert>
        )
      }

      if (!resources || resources.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">В этой группе пока нет ресурсов.</p>
          </div>
        )
      }

      // Group resources by subgroup
      const resourcesBySubgroup = resources.reduce((acc, resource) => {
        const subgroup = resource.subgroup_name || "Без подгруппы"
        if (!acc[subgroup]) {
          acc[subgroup] = []
        }
        acc[subgroup].push(resource)
        return acc
      }, {})

      return renderResources(resourcesBySubgroup)
    } catch (error) {
      // Если произошла непредвиденная ошибка, используем резервные данные
      console.error("Unexpected error in ResourcesList:", error)
      return renderResources(FALLBACK_RESOURCES[groupName] || {})
    }
  } catch (error) {
    console.error("Critical error in ResourcesList:", error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>
          Произошла критическая ошибка. Пожалуйста, попробуйте позже.
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Обновить страницу
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
}

// Функция для рендеринга ресурсов
function renderResources(resourcesBySubgroup) {
  // Создаем список подгрупп для якорных ссылок
  const subgroups = Object.keys(resourcesBySubgroup)

  return (
    <>
      {/* Блок с якорными ссылками на подгруппы */}
      {subgroups.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Перейти к разделу:</h2>
          <div className="flex flex-wrap gap-2">
            {subgroups.map((subgroup) => (
              <a href={`#${createSafeId(subgroup)}`} key={subgroup}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {subgroup}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {Object.entries(resourcesBySubgroup).map(([subgroup, resources]) => (
          <div key={subgroup} id={createSafeId(subgroup)}>
            <h2 className="text-2xl font-semibold mb-6">{subgroup}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function ClientGroupPage({ params }) {
  const groupName = decodeURIComponent(params.slug)

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад на главную
      </Link>

      <h1 className="text-4xl font-bold mb-10">{groupName}</h1>

      <Suspense fallback={<div>Загрузка ссылок на группы...</div>}>
        <GroupLinks />
      </Suspense>

      <Suspense fallback={<ResourceSkeleton />}>
        <ResourcesList groupName={groupName} />
      </Suspense>
    </main>
  )
}
