import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDate, createSeoUrl } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

export const metadata = {
  title: "Обновления | Библиотечка",
  description: "История обновлений и новые материалы на портале Библиотечка",
}

export default async function UpdatesPage() {
  const supabase = createClient()

  // Получаем все версии, отсортированные по дате выпуска (от новых к старым)
  const { data: versions } = await supabase.from("versions").select("*").order("release_date", { ascending: false })

  // Для каждой версии получаем ресурсы
  const versionResources = {}

  for (const version of versions || []) {
    const { data: resources } = await supabase
      .from("resources")
      .select("slug, title, description, group_slug, status_slug")
      .eq("version_id", version.slug)
      .eq("status_slug", "published") // Только опубликованные ресурсы
      .order("title")

    if (resources && resources.length > 0) {
      versionResources[version.slug] = {
        version,
        resources,
      }
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад на главную
      </Link>

      <h1 className="text-4xl font-bold mb-2">История обновлений</h1>
      <p className="text-muted-foreground mb-10">Новые материалы и обновления на портале</p>

      <div className="space-y-12">
        {Object.entries(versionResources).map(([versionSlug, { version, resources }]) => (
          <div key={versionSlug}>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-6">
              <h2 className="text-2xl font-semibold">Версия {version.version}</h2>
              {version.display_name && <span className="text-lg text-muted-foreground">{version.display_name}</span>}
              {version.release_date && <Badge variant="outline">{formatDate(version.release_date)}</Badge>}
            </div>

            {version.description && <p className="text-muted-foreground mb-6">{version.description}</p>}

            <ul className="space-y-4 list-none pl-0">
              {resources.map((resource) => (
                <li key={resource.slug} className="border-b pb-4 last:border-b-0">
                  <Link
                    href={`/${resource.group_slug}/${createSeoUrl(resource.title, resource.slug.toString())}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-900 -mx-2 px-2 py-1 rounded-md"
                  >
                    <h3 className="font-medium text-lg mb-1">{resource.title}</h3>
                    {resource.description && <p className="text-muted-foreground">{resource.description}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {Object.keys(versionResources).length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Пока нет данных об обновлениях.</p>
          </div>
        )}
      </div>
    </main>
  )
}
