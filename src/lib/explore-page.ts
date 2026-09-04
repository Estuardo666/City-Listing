/**
 * Corta una pagina de resultados y calcula el cursor siguiente.
 *
 * Los filtros que no se pueden expresar en SQL se aplican en memoria sobre las
 * filas leidas, asi que el siguiente `skip` NO puede avanzar con el numero de
 * items devueltos: debe apuntar a la primera fila de la BD que no se uso. Si no,
 * la pagina siguiente repite lo ya mostrado (o se salta resultados).
 */
export function pageSlice<T extends { id: string }>(
  rows: T[],
  filtered: T[],
  take: number,
  /** Cuantas filas se le pidieron a la BD: si devolvio menos, no hay mas. */
  requested: number
): { items: T[]; consumed: number; hasMore: boolean } {
  const items = filtered.slice(0, take)
  const lastId = items[items.length - 1]?.id
  const consumed = lastId ? rows.findIndex((r) => r.id === lastId) + 1 : rows.length
  const hasMore = !(rows.length < requested && consumed >= rows.length)
  return { items, consumed, hasMore }
}
