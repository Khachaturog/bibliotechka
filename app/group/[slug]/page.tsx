import { ClientGroupPage } from "./ClientGroupPage"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }) {
  const groupName = decodeURIComponent(params.slug)
  return {
    title: `${groupName} | Библиотечка`,
    description: `Коллекция ресурсов в группе ${groupName}`,
  }
}

export default function GroupPage({ params }) {
  return <ClientGroupPage params={params} />
}
