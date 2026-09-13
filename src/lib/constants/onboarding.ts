export const LIFESTYLE_OPTIONS = [
  { id: 'NIGHTLIFE', label: 'Salir con amigos', description: 'Bares, música y planes para la noche', icon: 'Users', keywords: ['bar', 'discoteca', 'noche', 'coctel', 'cerveza'] },
  { id: 'DATES', label: 'Planes en pareja', description: 'Lugares tranquilos y experiencias para dos', icon: 'Heart', keywords: ['románt', 'café', 'restaurante', 'mirador'] },
  { id: 'FAMILY', label: 'En familia', description: 'Actividades y espacios para todas las edades', icon: 'Baby', keywords: ['famil', 'niñ', 'parque', 'recreación'] },
  { id: 'REMOTE_WORK', label: 'Trabajar fuera', description: 'Cafés y espacios cómodos para concentrarse', icon: 'Laptop', keywords: ['café', 'cowork', 'biblioteca', 'internet'] },
  { id: 'CONCERTS', label: 'Música en vivo', description: 'Conciertos, festivales y presentaciones', icon: 'Music2', keywords: ['música', 'concierto', 'festival', 'show'] },
  { id: 'NATURE', label: 'Aire libre', description: 'Naturaleza, rutas y miradores', icon: 'Trees', keywords: ['naturaleza', 'parque', 'sender', 'mirador', 'aire libre'] },
  { id: 'GASTRONOMY', label: 'Comer bien', description: 'Restaurantes, sabores locales y novedades', icon: 'Utensils', keywords: ['restaurante', 'comida', 'gastronom', 'cocina'] },
  { id: 'INSTAGRAMMABLE', label: 'Lugares con buena vista', description: 'Arquitectura, paisajes y espacios fotogénicos', icon: 'Camera', keywords: ['mirador', 'arte', 'arquitectura', 'paisaje'] },
  { id: 'SPORTS', label: 'Deporte', description: 'Partidos, entrenamiento y actividad física', icon: 'Dumbbell', keywords: ['deporte', 'fútbol', 'gimnasio', 'cancha'] },
  { id: 'CULTURE', label: 'Arte y cultura', description: 'Teatro, museos, cine y exposiciones', icon: 'Landmark', keywords: ['cultura', 'arte', 'teatro', 'museo', 'cine'] },
  { id: 'COFFEE_HOPPING', label: 'Café y conversación', description: 'Cafeterías para descubrir sin prisa', icon: 'Coffee', keywords: ['café', 'cafetería', 'panadería'] },
  { id: 'WELLNESS', label: 'Bienestar', description: 'Salud, descanso y cuidado personal', icon: 'Leaf', keywords: ['bienestar', 'spa', 'salud', 'yoga'] },
] as const

export const ONBOARDING_COPY = {
  step1: {
    title: '¿Qué quieres encontrar en Loja?',
    subtitle: 'Elige al menos tres temas. Esto define qué aparece primero en tu inicio.',
  },
  step2: {
    title: '¿Cómo te gusta vivir la ciudad?',
    subtitle: 'Puedes combinar varias opciones y cambiarlas después.',
  },
  step3: {
    title: '¿Quieres seguir algún lugar?',
    subtitle: 'Es opcional. Seguir un lugar hace que sus novedades aparezcan antes.',
  },
  step4: {
    title: 'Tu inicio ya tiene una dirección',
    subtitle: 'Usaremos estas señales para ordenar eventos, lugares y novedades.',
  },
} as const

export const MIN_INTERESTS = 3

export type LifestyleOption = typeof LIFESTYLE_OPTIONS[number]
export type LifestyleId = LifestyleOption['id']

export function getLifestyleKeywords(preferences: string[]) {
  const selected = new Set(preferences)
  return LIFESTYLE_OPTIONS
    .filter((option) => selected.has(option.id))
    .flatMap((option) => option.keywords)
}
