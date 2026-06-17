export const LIFESTYLE_OPTIONS = [
  { id: 'NIGHTLIFE', label: 'Salir con amigos', emoji: '🍻', color: 'from-amber-400 to-orange-500' },
  { id: 'DATES', label: 'Citas', emoji: '❤️', color: 'from-rose-400 to-pink-500' },
  { id: 'FAMILY', label: 'Planes familiares', emoji: '👨‍👩‍👧', color: 'from-sky-400 to-blue-500' },
  { id: 'REMOTE_WORK', label: 'Trabajar fuera', emoji: '💻', color: 'from-violet-400 to-purple-500' },
  { id: 'CONCERTS', label: 'Conciertos', emoji: '🎵', color: 'from-fuchsia-400 to-pink-500' },
  { id: 'NATURE', label: 'Naturaleza', emoji: '🌄', color: 'from-emerald-400 to-green-500' },
  { id: 'GASTRONOMY', label: 'Gastronomía', emoji: '🍽️', color: 'from-orange-400 to-red-500' },
  { id: 'INSTAGRAMMABLE', label: 'Lugares instagrameables', emoji: '📸', color: 'from-cyan-400 to-teal-500' },
  { id: 'SPORTS', label: 'Deportes', emoji: '⚽', color: 'from-lime-400 to-emerald-500' },
  { id: 'CULTURE', label: 'Cultura', emoji: '🎭', color: 'from-indigo-400 to-blue-500' },
  { id: 'COFFEE_HOPPING', label: 'Coffee hopping', emoji: '☕', color: 'from-amber-500 to-yellow-500' },
  { id: 'WELLNESS', label: 'Bienestar', emoji: '🧘', color: 'from-teal-400 to-cyan-500' },
] as const

export const ONBOARDING_COPY = {
  step1: {
    title: '¿Qué te interesa descubrir en Loja?',
    subtitle: 'Personaliza tu experiencia seleccionando lo que más te gusta.',
  },
  step2: {
    title: '¿Qué tipo de planes disfrutas?',
    subtitle: 'Ayúdanos a mostrarte mejores recomendaciones.',
  },
  step3: {
    title: 'Sigue algunos lugares populares',
    subtitle: 'Crea tu red de locales favoritos para descubrir más.',
  },
  step4: {
    title: '¡Bienvenido a ViveLoja!',
    subtitle: 'Tu experiencia personalizada está lista.',
  },
} as const

export const MIN_INTERESTS = 3

export type LifestyleOption = typeof LIFESTYLE_OPTIONS[number]
export type LifestyleId = LifestyleOption['id']
