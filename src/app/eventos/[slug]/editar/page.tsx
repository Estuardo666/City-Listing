import { redirect } from 'next/navigation'

type EventEditPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function EventEditPage({ params }: EventEditPageProps) {
  const { slug } = await params
  redirect(`/dashboard/eventos/${slug}/editar`)
}
