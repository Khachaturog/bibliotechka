import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { createSeoUrl } from "@/lib/utils"

export default async function DebugPage() {
  const supabase = createClient()

  // Получаем все группы
  const { data: groups } = await supabase.from("groups").select("*").order("display_name")

  // Получаем все ресурсы
  const { data: resources } = await supabase.from("resources").select("*").order("title").limit(100)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Отладочная страница</h1>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Группы ({groups?.length || 0})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group) => (
            <div key={group.slug} className="border p-4 rounded-lg">
              <h3 className="font-medium">{group.display_name || group.slug}</h3>
              <p className="text-sm text-gray-500 mb-2">Slug: {group.slug}</p>
              <Link href={`/${group.slug}`} className="text-blue-500 hover:underline text-sm">
                Перейти к группе
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Ресурсы ({resources?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Название</th>
                <th className="border p-2 text-left">Группа</th>
                <th className="border p-2 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {resources?.map((resource) => {
                const seoUrl = createSeoUrl(resource.title, resource.id)
                return (
                  <tr key={resource.id} className="border-b">
                    <td className="border p-2 font-mono text-xs">{resource.id}</td>
                    <td className="border p-2">{resource.title}</td>
                    <td className="border p-2">{resource.group_slug}</td>
                    <td className="border p-2">
                      <Link
                        href={`/${resource.group_slug}/${seoUrl}`}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
