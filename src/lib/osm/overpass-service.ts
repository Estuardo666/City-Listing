import type {
  OsmPlace,
  OverpassResponse,
  OverpassElement,
} from '@/types/osm-import'
import { OSM_CATEGORIES } from '@/types/osm-import'

interface BuildQueryParams {
  city: string
  country: string
  radius: number
  categories: string[]
  coordinates?: { lat: number; lon: number }
}

class OverpassService {
  private baseUrl: string
  private timeout: number
  private userAgent: string

  constructor() {
    this.baseUrl = 'https://overpass-api.de/api/interpreter'
    this.timeout = 30
    this.userAgent = 'ViveLoja/1.0'
  }

  configure(options: { url?: string; timeout?: number; userAgent?: string }) {
    if (options.url) this.baseUrl = options.url
    if (options.timeout) this.timeout = options.timeout
    if (options.userAgent) this.userAgent = options.userAgent
  }

  buildQuery(params: BuildQueryParams): string {
    const { city, country, radius, categories, coordinates } = params

    const categoryFilters = categories
      .map((key) => {
        const cat = OSM_CATEGORIES[key]
        if (!cat) return ''
        const [tagKey, tagValue] = cat.overpassTag.split('=')
        return `  node["${tagKey}"="${tagValue}"](around:${radius},\${LAT},\${LON});
  way["${tagKey}"="${tagValue}"](around:${radius},\${LAT},\${LON});`
      })
      .filter(Boolean)
      .join('\n')

    const lat = coordinates?.lat ?? 0
    const lon = coordinates?.lon ?? 0

    const query = `[out:json][timeout:${this.timeout}];
(
${categoryFilters.replace(/\$\{LAT\}/g, String(lat)).replace(/\$\{LON\}/g, String(lon))}
);
out center;`

    return query
  }

  async searchPlaces(
    params: BuildQueryParams & { coordinates: { lat: number; lon: number } }
  ): Promise<OsmPlace[]> {
    const query = this.buildQuery(params)

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Overpass API error: ${response.status} - ${text}`)
    }

    const data: OverpassResponse = await response.json()
    return this.parseResults(data, params.categories)
  }

  parseResults(data: OverpassResponse, selectedCategories: string[]): OsmPlace[] {
    if (!data.elements) return []

    return data.elements.map((el) => this.parseElement(el, selectedCategories)).filter(Boolean) as OsmPlace[]
  }

  private parseElement(el: OverpassElement, selectedCategories: string[]): OsmPlace | null {
    const tags = el.tags ?? {}
    const name = tags['name:es'] ?? tags['name'] ?? tags['name:en'] ?? ''
    if (!name) return null

    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) return null

    const category = this.detectCategory(tags, selectedCategories)

    const addressParts: string[] = []
    if (tags['addr:street']) {
      addressParts.push(tags['addr:street'] + (tags['addr:housenumber'] ? ` ${tags['addr:housenumber']}` : ''))
    }
    if (tags['addr:city']) addressParts.push(tags['addr:city'])
    if (tags['addr:postcode']) addressParts.push(tags['addr:postcode'])

    return {
      id: `${el.type}/${el.id}`,
      type: el.type,
      osmId: el.id,
      name,
      category,
      address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
      phone: tags['phone'] ?? tags['contact:phone'],
      website: tags['website'] ?? tags['contact:website'],
      email: tags['email'] ?? tags['contact:email'],
      openingHours: tags['opening_hours'],
      lat,
      lon,
      tags,
    }
  }

  private detectCategory(tags: Record<string, string>, selectedCategories: string[]): string {
    for (const key of selectedCategories) {
      const cat = OSM_CATEGORIES[key]
      if (!cat) continue
      const [tagKey, tagValue] = cat.overpassTag.split('=')
      if (tags[tagKey] === tagValue) return key
    }
    return selectedCategories[0] ?? 'other'
  }

  async geocodeCity(city: string, country: string): Promise<{ lat: number; lon: number } | null> {
    const query = encodeURIComponent(`${city}, ${country}`)
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    })

    if (!response.ok) return null

    const results = await response.json()
    if (!results || results.length === 0) return null

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    }
  }
}

export const overpassService = new OverpassService()
