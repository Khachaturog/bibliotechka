import { createClient } from "@/utils/supabase/server"
import { ResourceCard } from "@/components/resource-card"
import { Suspense } from "react"
import { ResourceSkeleton } from "@/components/skeletons"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const groupName = decodeURIComponent(params.name)
  return {
    title: `${groupName} | Библиотечка`,
    description: `Коллекция ресурсов в группе ${groupName}`,
  }
}

async function ResourcesList({ groupName }) {
  const supabase = createClient()

  const { data: resources, error } = await supabase
    .from("resources")
    .select("*")
    .eq("group_name", groupName)
    .order("subgroup_name", { ascending: true })
    .order("title", { ascending: true })

  if (error) {
    console.error("Error fetching resources:", error)
    return <div>Ошибка загрузки ресурсов</div>
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

  return (
    <div className="space-y-12">
      {Object.entries(resourcesBySubgroup).map(([subgroup, resources]) => (
        <div key={subgroup}>
          <h2 className="text-2xl font-semibold mb-6">{subgroup}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GroupPage({ params }) {
  const groupName = decodeURIComponent(params.name)

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад на главную
      </Link>

      <h1 className="text-4xl font-bold mb-10">{groupName}</h1>

      <Suspense fallback={<ResourceSkeleton />}>
        <ResourcesList groupName={groupName} />
      </Suspense>
    </main>
  )
}
