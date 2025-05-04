import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

export const metadata = {
  title: "Управление версиями | Библиотечка",
  description: "Административная панель для управления версиями",
}

export default async function VersionsAdminPage() {
  const supabase = createClient()

  // Получаем все версии, отсортированные по дате выпуска (от новых к старым)
  const { data: versions } = await supabase.from("versions").select("*").order("release_date", { ascending: false })

  // Для каждой версии получаем количество ресурсов
  const versionCounts = {}

  for (const version of versions || []) {
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("version_id", version.slug)

    versionCounts[version.slug] = count || 0
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Link href="/admin" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад в админку
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Управление версиями</h1>
        {/* Кнопка "Добавить версию" удалена по запросу */}
      </div>

      <div className="space-y-6">
        {versions?.map((version) => (
          <Card key={version.slug}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Версия {version.version}
                    <Badge variant="outline">{formatDate(version.release_date)}</Badge>
                  </CardTitle>
                  {version.display_name && <p className="text-muted-foreground">{version.display_name}</p>}
                </div>
                <Badge>{versionCounts[version.slug]} ресурсов</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {version.description && <p className="mb-4">{version.description}</p>}
              {/* Кнопки "Редактировать" и "Удалить" удалены по запросу */}
            </CardContent>
          </Card>
        ))}

        {!versions || versions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Пока нет версий. Создайте первую версию.</p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
