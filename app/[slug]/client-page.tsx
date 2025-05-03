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

function ClientGroupPage({ initialGroupName, initialDisplayName }) {
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [resources, setResources] = useState([])
  const [resourcesBySubgroup, setResourcesBySubgroup] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const supabase = createClientComponentClient()

        // Fetch all group translations
        const { data: translations, error: translationsError } = await supabase
          .from("group_translations")
          .select("*")
          .order("display_name")

        if (translationsError) {
          console.error("Error fetching group translations:", translationsError)
          // If translations fail, try to get original group names
          const { data: groups, error } = await supabase.from("resources").select("group_name").order("group_name")

          if (error) {
            throw error
          }

          if (groups && groups.length > 0) {
            // Get unique group names
            const uniqueGroups = [...new Set(groups.map((item) => item.group_name))]
            setGroups(
              uniqueGroups.map((name) => ({
                original_name: name,
                display_name: name,
                slug: encodeURIComponent(name),
              })),
            )
          }
        } else if (translations && translations.length > 0) {
          setGroups(translations)
        }
      } catch (err) {
        console.error("Error fetching groups:", err)
        setError("Не удалось загрузить список групп")
      }
    }

    const fetchResources = async () => {
      try {
        const supabase = createClientComponentClient()

        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("group_name", initialGroupName)
          .order("subgroup_name", { ascending: true })
          .order("title", { ascending: true })

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setResources(data)

          // Group resources by subgroup
          const bySubgroup = data.reduce((acc, resource) => {
            const subgroup = resource.subgroup_name || "Без подгруппы"
            if (!acc[subgroup]) {
              acc[subgroup] = []
            }
            acc[subgroup].push(resource)
            return acc
          }, {})

          setResourcesBySubgroup(bySubgroup)
        }
      } catch (err) {
        console.error("Error fetching resources:", err)
        setError("Не удалось загрузить ресурсы")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
    fetchResources()
  }, [initialGroupName])

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад на главную
      </Link>

      <h1 className="text-4xl font-bold mb-10">{initialDisplayName}</h1>

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
            {groups.map((group) => (
              <Link
                href={`/${group.slug || encodeURIComponent(group.original_name)}`}
                key={group.id || group.original_name}
              >
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {group.display_name}
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
export { ClientGroupPage }
