import { redirect } from 'next/navigation'

type VenueEditPageProps = {
  params: Promise<{ slug: string }>
}

export default async function VenueEditPage({ params }: VenueEditPageProps) {
  const { slug } = await params
  redirect(`/dashboard/locales/${slug}/editar`)
}
