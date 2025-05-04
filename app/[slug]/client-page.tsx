"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ResourceCard } from "@/components/resource-card"
import { ResourceSkeleton } from "@/components/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createSafeId } from "@/lib/utils"
import { createClientComponentClient } from "@/utils/supabase/client"
import type { Group, Resource, Subgroup, Status } from "@/utils/supabase/types"
import { STATUSES } from "@/utils/supabase/types"

export function ClientGroupPage({ group }: { group: Group }) {
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [subgroups, setSubgroups] = useState<Subgroup[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [resourcesBySubgroup, setResourcesBySubgroup] = useState<Record<string, Resource[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Status[]>([])

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const supabase = createClientComponentClient()

        // Получаем все группы
        const { data, error } = await supabase.from("groups").select("*").order("display_name")

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setGroups(data)
        }
      } catch (err) {
        console.error("Error fetching groups:", err)
        setError("Не удалось загрузить список групп")
      }
    }

    const fetchSubgroups = async () => {
      try {
        const supabase = createClientComponentClient()

        // Получаем все подгруппы
        const { data, error } = await supabase.from("subgroups").select("*").order("display_name")

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setSubgroups(data)
        }
      } catch (err) {
        console.error("Error fetching subgroups:", err)
        setError("Не удалось загрузить список подгрупп")
      }
    }

    const fetchStatuses = async () => {
      try {
        const supabase = createClientComponentClient()

        // Получаем все статусы
        const { data, error } = await supabase.from("statuses").select("*")

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setStatuses(data)
        }
      } catch (err) {
        console.error("Error fetching statuses:", err)
        setError("Не удалось загрузить список статусов")
      }
    }

    const fetchResources = async () => {
      try {
        const supabase = createClientComponentClient()

        // Базовый запрос с фильтрацией только опубликованных ресурсов
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("group_slug", group.slug)
          .eq("status_slug", STATUSES.PUBLISHED) // Только опубликованные ресурсы
          .order("title", { ascending: true })

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setResources(data)

          // Group resources by subgroup
          const bySubgroup = data.reduce((acc, resource) => {
            // Получаем имя подгруппы из subgroup_slug
            let subgroupName = "Без подгруппы"

            if (resource.subgroup_slug) {
              const subgroup = subgroups.find((sg) => sg.slug === resource.subgroup_slug)
              if (subgroup) {
                subgroupName = subgroup.display_name || subgroup.slug
              }
            }

            if (!acc[subgroupName]) {
              acc[subgroupName] = []
            }
            acc[subgroupName].push(resource)
            return acc
          }, {})

          setResourcesBySubgroup(bySubgroup)
        } else {
          setResources([])
          setResourcesBySubgroup({})
        }
      } catch (err) {
        console.error("Error fetching resources:", err)
        setError("Не удалось загрузить ресурсы")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
    fetchSubgroups()
    fetchStatuses()
    fetchResources()
  }, [group.slug, subgroups])

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад на главную
      </Link>

      <h1 className="text-4xl font-bold mb-10">{group.display_name || group.slug}</h1>

      {/* Group links */}
      {error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : groups.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Другие группы:</h2>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Link href={`/${g.slug}`} key={g.slug}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {g.display_name || g.slug}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Resources */}
      {isLoading ? (
        <ResourceSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">В этой группе пока нет ресурсов.</p>
        </div>
      ) : (
        <>
          {/* Subgroup anchor links */}
          {Object.keys(resourcesBySubgroup).length > 1 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-3">Перейти к разделу:</h2>
              <div className="flex flex-wrap gap-2">
                {Object.keys(resourcesBySubgroup).map((subgroup) => (
                  <a href={`#${createSafeId(subgroup)}`} key={subgroup}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {subgroup}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resources by subgroup */}
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
      )}
    </main>
  )
}

export default ClientGroupPage
