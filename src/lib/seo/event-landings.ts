import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { agendaWindow, type AgendaPeriod } from '@/lib/agenda-window'
import type { EventListItem } from '@/types/event'

export const SITE_URL = 'https://viveloja.com'

export type EventLandingConfig = {
  path: string
  eyebrow: string
  title: string
  description: string
  intro: string
  terms?: string[]
  period?: AgendaPeriod
  sectionTitle: string
  emptyMessage: string
  faqs: Array<{ question: string; answer: string }>
  officialUrl?: string
  officialLabel?: string
}

export const EVENT_LANDING_CONFIGS: Record<string, EventLandingConfig> = {
  concerts: {
    path: 'conciertos-en-loja',
    eyebrow: 'Música en Loja',
    title: 'Conciertos en Loja: agenda de música en vivo',
    description:
      'Consulta conciertos en Loja, música en vivo y festivales: fechas, lugares, precios y enlaces para confirmar cómo asistir.',
    intro:
      'Consulta los próximos conciertos en Loja y descubre música en vivo, festivales, presentaciones y noches especiales. Vive Loja reúne la agenda local en un solo lugar con fecha, ubicación y detalles útiles para planificar tu salida.',
    terms: ['concierto', 'conciertos', 'música', 'musica', 'festival', 'salsa', 'rock', 'dj'],
    sectionTitle: 'Próximos conciertos y eventos musicales',
    emptyMessage: 'Todavía no hay conciertos publicados para esta selección. Revisa la agenda general de eventos en Loja.',
    faqs: [
      {
        question: '¿Dónde puedo encontrar conciertos en Loja?',
        answer:
          'En Vive Loja puedes revisar conciertos, música en vivo y festivales publicados por organizadores y locales de la ciudad, con fecha y ubicación.',
      },
      {
        question: '¿Hay conciertos gratuitos en Loja?',
        answer:
          'Algunos eventos tienen entrada libre. Revisa la ficha de cada concierto para confirmar el precio, el lugar y las condiciones de ingreso.',
      },
    ],
  },
  culture: {
    path: 'eventos-culturales-loja',
    eyebrow: 'Cultura y comunidad',
    title: 'Eventos culturales en Loja: agenda y actividades',
    description:
      'Consulta la agenda cultural de Loja: teatro, danza, exposiciones, ferias, talleres y actividades con fechas y lugares.',
    intro:
      'Encuentra actividades culturales en Loja para todas las edades: teatro, danza, exposiciones, folklore, ferias, talleres y encuentros comunitarios. Consulta la programación, el lugar y la fecha de cada actividad antes de salir.',
    terms: ['cultural', 'cultura', 'teatro', 'danza', 'folklore', 'exposición', 'exposicion', 'feria', 'taller'],
    sectionTitle: 'Próximos eventos culturales en Loja',
    emptyMessage: 'No hay actividades culturales próximas publicadas en este momento. Explora la agenda completa para ver otras opciones.',
    faqs: [
      {
        question: '¿Qué actividades culturales hay en Loja?',
        answer:
          'La agenda incluye exposiciones, teatro, danza, folklore, ferias, talleres y otras actividades culturales publicadas para Loja.',
      },
      {
        question: '¿Cómo saber si un evento cultural es gratuito?',
        answer:
          'La ficha de cada actividad muestra el precio cuando el organizador lo informa. Si el precio es cero, aparece como entrada libre.',
      },
    ],
  },
  arts: {
    path: 'artes-vivas-loja',
    eyebrow: 'Arte, teatro y danza',
    title: 'Artes Vivas en Loja: agenda de teatro, danza y FIAVL',
    description:
      'Consulta la agenda de Artes Vivas en Loja: teatro, danza, performance, FIAVL y actividades artísticas con sedes y fechas.',
    intro:
      'Explora la escena de Artes Vivas en Loja: teatro, danza, performance, exposiciones y propuestas de artistas locales e invitados. Esta guía reúne actividades publicadas en la ciudad y enlaza a la agenda general para que encuentres nuevos planes.',
    terms: ['artes vivas', 'fiavl', 'teatro', 'danza', 'performance', 'arte', 'artística', 'artistica'],
    sectionTitle: 'Programación de Artes Vivas y arte en Loja',
    emptyMessage: 'No hay actividades de Artes Vivas publicadas para las próximas fechas. Consulta la agenda cultural y vuelve pronto.',
    faqs: [
      {
        question: '¿Qué son las Artes Vivas en Loja?',
        answer:
          'Artes Vivas reúne expresiones escénicas y artísticas como teatro, danza, performance, música y propuestas interdisciplinarias que se presentan en Loja.',
      },
      {
        question: '¿Dónde consultar la programación oficial del FIAVL?',
        answer:
          'Para fechas y anuncios oficiales del Festival Internacional de Artes Vivas de Loja, consulta siempre los canales oficiales enlazados desde esta página.',
      },
    ],
    officialUrl: 'https://linktr.ee/FestivalArtesVivasLoja',
    officialLabel: 'Ver canales oficiales del FIAVL',
  },
  fiavl: {
    path: 'fiavl',
    eyebrow: 'Festival Internacional de Artes Vivas',
    title: 'FIAVL en Loja: programación, fechas y actividades',
    description:
      'Consulta información del FIAVL en Loja: programación, teatro, danza, sedes, fechas y enlaces oficiales para verificar cada anuncio.',
    intro:
      'Vive Loja te ayuda a descubrir actividades relacionadas con el FIAVL y la escena artística de la ciudad. Consulta eventos publicados, sedes y enlaces oficiales para confirmar la programación, entradas y cambios de última hora.',
    terms: ['fiavl', 'festival internacional de artes vivas', 'artes vivas', 'festival de loja', 'teatro', 'danza'],
    sectionTitle: 'Eventos relacionados con el FIAVL',
    emptyMessage: 'Aún no hay actividades del FIAVL publicadas en Vive Loja. Consulta los canales oficiales y la agenda cultural de la ciudad.',
    faqs: [
      {
        question: '¿Qué significa FIAVL?',
        answer:
          'FIAVL es el Festival Internacional de Artes Vivas de Loja, un encuentro dedicado a las artes escénicas y a la programación cultural de la ciudad.',
      },
      {
        question: '¿Dónde se realiza el FIAVL?',
        answer:
          'Las sedes y horarios cambian según cada edición. Revisa la ficha del evento y confirma la información en los canales oficiales del festival.',
      },
    ],
    officialUrl: 'https://linktr.ee/FestivalArtesVivasLoja',
    officialLabel: 'Consultar información oficial del FIAVL',
  },
  today: {
    path: 'eventos-hoy-en-loja',
    eyebrow: 'Agenda de hoy',
    title: 'Eventos hoy en Loja: agenda y qué hacer',
    description:
      'Descubre qué hacer hoy en Loja: conciertos, cultura, ferias y actividades con horarios, lugares y precios publicados.',
    intro:
      '¿Buscas qué hacer hoy en Loja? Revisa las actividades publicadas para este día, consulta horarios y ubicaciones, y elige un plan cerca de ti.',
    period: 'today',
    sectionTitle: 'Actividades disponibles hoy en Loja',
    emptyMessage: 'No hay eventos publicados para hoy. Revisa los próximos eventos de Loja para encontrar otra fecha.',
    faqs: [
      {
        question: '¿Qué hay para hacer hoy en Loja?',
        answer:
          'Vive Loja reúne los eventos publicados para el día actual, incluyendo cultura, música, ferias y actividades locales.',
      },
      {
        question: '¿La agenda de hoy se actualiza?',
        answer:
          'Sí. La página se actualiza varias veces al día para mostrar eventos aprobados y sus datos disponibles.',
      },
    ],
  },
  weekend: {
    path: 'eventos-este-fin-de-semana-en-loja',
    eyebrow: 'Planifica tu fin de semana',
    title: 'Eventos este fin de semana en Loja: qué hacer',
    description:
      'Planifica qué hacer este fin de semana en Loja: conciertos, eventos culturales, ferias y actividades con fechas, lugares y precios.',
    intro:
      'Planifica tu fin de semana en Loja con una selección de conciertos, actividades culturales, ferias y experiencias locales. Revisa cada ficha para confirmar fecha, horario, lugar y precio.',
    period: 'weekend',
    sectionTitle: 'Qué hacer este fin de semana en Loja',
    emptyMessage: 'No hay eventos publicados para este fin de semana. Explora los próximos 30 días para ver más opciones.',
    faqs: [
      {
        question: '¿Qué hacer este fin de semana en Loja?',
        answer:
          'Consulta la agenda de Vive Loja para encontrar conciertos, cultura, ferias, actividades gratuitas y otros planes para el fin de semana.',
      },
      {
        question: '¿Cómo confirmar el horario de un evento?',
        answer:
          'Abre la ficha del evento para revisar el horario, ubicación, precio y cualquier enlace de reserva publicado por el organizador.',
      },
    ],
  },
}

export const EVENT_LANDING_PATHS = Object.values(EVENT_LANDING_CONFIGS).map((config) => config.path)

const eventListSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  title: true,
  slug: true,
  description: true,
  image: true,
  startDate: true,
  endDate: true,
  location: true,
  address: true,
  lat: true,
  lng: true,
  venueId: true,
  featured: true,
  sponsoredUntil: true,
  status: true,
  price: true,
  isRecurring: true,
  avgRating: true,
  reviewCount: true,
  venue: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  eventCategories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
        },
      },
    },
  },
})

function textFilter(terms: string[]): Prisma.EventWhereInput {
  const clauses: Prisma.EventWhereInput[] = []

  for (const term of terms) {
    const text = { contains: term, mode: 'insensitive' as const }
    clauses.push(
      { title: text },
      { description: text },
      { content: text },
      { location: text },
      { address: text },
      {
        eventCategories: {
          some: {
            category: {
              OR: [{ name: text }, { slug: text }],
            },
          },
        },
      },
    )
  }

  return { OR: clauses }
}

export async function getSeoEventLandingEvents(
  config: EventLandingConfig,
  take = 24,
): Promise<EventListItem[]> {
  const now = new Date()
  const dateRange = config.period ? agendaWindow(config.period, now) : null

  const dateFilter: Prisma.EventWhereInput = dateRange
    ? {
        startDate: { lt: dateRange.end },
        OR: [
          { startDate: { gte: dateRange.start } },
          { endDate: { gte: dateRange.start } },
        ],
      }
    : {
        OR: [{ startDate: { gte: now } }, { endDate: { gte: now } }],
      }

  const where: Prisma.EventWhereInput = {
    status: 'APPROVED',
    AND: [dateFilter],
  }

  if (config.terms?.length) {
    where.AND = [...(where.AND as Prisma.EventWhereInput[]), textFilter(config.terms)]
  }

  return prisma.event.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { startDate: 'asc' }, { updatedAt: 'desc' }],
    take,
    select: eventListSelect,
  })
}

export function buildEventLandingMetadata(config: EventLandingConfig) {
  const canonical = `${SITE_URL}/${config.path}`

  return {
    title: config.title,
    description: config.description,
    keywords: [config.path.split('-').join(' '), 'Loja', 'Ecuador'],
    alternates: { canonical },
    openGraph: {
      title: `${config.title} | Vive Loja`,
      description: config.description,
      url: canonical,
      siteName: 'Vive Loja',
      locale: 'es_EC',
      type: 'website' as const,
      images: [
        {
          url: `${SITE_URL}/viveloja.png`,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: config.title,
      description: config.description,
      images: [`${SITE_URL}/viveloja.png`],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1,
    },
  }
}
