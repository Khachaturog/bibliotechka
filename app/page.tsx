import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { GroupSkeleton } from "@/components/skeletons"

export const revalidate = 3600 // Revalidate every hour

async function GroupsList() {
  const supabase = createClient()

  // Get unique groups with count
  const { data: groups, error } = await supabase.from("resources").select("group_name, id").order("group_name")

  if (error) {
    console.error("Error fetching groups:", error)
    return <div>Ошибка загрузки групп</div>
  }

  // Count resources per group
  const groupCounts = groups.reduce((acc, { group_name }) => {
    acc[group_name] = (acc[group_name] || 0) + 1
    return acc
  }, {})

  // Get unique group names
  const uniqueGroups = [...new Set(groups.map((item) => item.group_name))]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueGroups.map((group) => (
        <Link href={`/group/${encodeURIComponent(group)}`} key={group}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="line-clamp-2">{group}</CardTitle>
              <CardDescription>Ресурсов: {groupCounts[group]}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge variant="outline">Перейти к группе</Badge>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-2">Библиотечка</h1>
      <p className="text-muted-foreground mb-10">Коллекция полезных ресурсов и материалов</p>

      <Suspense fallback={<GroupSkeleton />}>
        <GroupsList />
      </Suspense>
    </main>
  )
}
