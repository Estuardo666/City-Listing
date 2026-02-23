import { Search } from '@upstash/search'

// Configuración de Upstash Search - usar fromEnv() para leer variables automáticamente
const searchClient = Search.fromEnv()
const searchIndex = searchClient.index("city-listing")

// Tipos para los documentos de búsqueda
export interface SearchDocument {
  id: string
  type: 'event' | 'venue' | 'post'
  title: string
  description?: string
  location?: string
  category: string
  data: any // Datos originales completos
}

// Función para indexar un documento
export async function indexDocument(doc: SearchDocument) {
  try {
    // Crear el documento con el formato correcto
    const documentId = `${doc.type}:${doc.id}`
    
    // Usar el formato correcto: solo content con todos los datos
    await searchIndex.upsert({
      id: documentId,
      content: {
        title: doc.title,
        description: doc.description || '',
        location: doc.location || '',
        category: doc.category,
        type: doc.type,
        text: `${doc.title} ${doc.description || ''} ${doc.location || ''} ${doc.category}`,
        originalData: doc.data
      }
    })
    
    console.log(`✅ Indexed ${doc.type}:${doc.id}`)
  } catch (error) {
    console.error(`❌ Error indexing ${doc.type}:${doc.id}:`, error)
  }
}

// Función para buscar documentos
export async function searchDocuments(query: string, limit: number = 10) {
  try {
    // Usar el método correcto: search con 'limit' en lugar de 'topK'
    const results = await searchIndex.search({
      query: query,
      limit: limit
    })

    // Los resultados vienen directamente y los datos están en content
    return results.map((result: any) => ({
      id: result.id,
      score: result.score || 1,
      type: result.content?.type || 'unknown',
      originalId: result.id.split(':')[1] || result.id,
      data: result.content?.originalData || result.content
    }))
  } catch (error) {
    console.error('❌ Search error:', error)
    return []
  }
}

// Función para eliminar un documento
export async function deleteDocument(type: string, id: string) {
  try {
    const documentId = `${type}:${id}`
    
    // Usar el método correcto: delete con array de IDs
    await searchIndex.delete([documentId])
    
    console.log(`🗑️ Deleted ${type}:${id}`)
  } catch (error) {
    console.error(`❌ Error deleting ${type}:${id}:`, error)
  }
}

// Función para indexar múltiples documentos (bulk)
export async function indexDocuments(docs: SearchDocument[]) {
  try {
    // Preparar documentos para bulk upsert con el formato correcto
    const documents = docs.map(doc => ({
      id: `${doc.type}:${doc.id}`,
      content: {
        title: doc.title,
        description: doc.description || '',
        location: doc.location || '',
        category: doc.category,
        type: doc.type,
        text: `${doc.title} ${doc.description || ''} ${doc.location || ''} ${doc.category}`,
        originalData: doc.data
      }
    }))

    // Usar upsert con todos los documentos
    await searchIndex.upsert(documents)
    console.log(`✅ Bulk indexed ${docs.length} documents`)
  } catch (error) {
    console.error('❌ Bulk index error:', error)
  }
}
