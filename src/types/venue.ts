import type { Prisma } from '@prisma/client'

export type VenueWithRelations = Prisma.VenueGetPayload<{
  include: {
    venueCategories: {
      select: {
        category: true
      }
    }
    venueSubcategories: {
      select: {
        subcategory: true
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    events: {
      select: {
        id: true
        title: true
        slug: true
        startDate: true
        location: true
        address: true
      }
    }
    media: {
      orderBy: { order: 'asc' }
    }
    operatingHours: true
    businessHours: {
      orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }]
    }
    services: {
      orderBy: { sortOrder: 'asc' }
    }
    products: {
      orderBy: { order: 'asc' }
    }
    reviews: {
      include: {
        user: {
          select: {
            id: true
            name: true
            image: true
          }
        }
      }
      orderBy: { createdAt: 'desc' }
    }
    promotions: {
      where: { status: 'ACTIVE' }
      orderBy: { createdAt: 'desc' }
    }
    reservationSettings: true
  }
}>

export type UserVenueListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    image: true
    status: true
    isActive: true
    location: true
    address: true
    createdAt: true
    venueCategories: {
      select: {
        category: {
          select: {
            name: true
            icon: true
          }
        }
      }
    }
  }
}>

export type VenueListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    description: true
    image: true
    location: true
    address: true
    lat: true
    lng: true
    featured: true
    status: true
    phone: true
    website: true
    priceRange: true
    avgRating: true
    reviewCount: true
    verified: true
    badge: true
    venueCategories: {
      select: {
        category: {
          select: {
            id: true
            name: true
            slug: true
            color: true
            icon: true
          }
        }
      }
    }
  }
}>

export type VenueCategory = Prisma.CategoryGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    color: true
    icon: true
  }
}>

export type VenueMapItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    location: true
    address: true
    lat: true
    lng: true
    venueCategories: {
      select: {
        category: {
          select: {
            name: true
          }
        }
      }
    }
  }
}>

export type VenueAdminListItem = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    description: true
    location: true
    address: true
    lat: true
    lng: true
    status: true
    isActive: true
    featured: true
    priceRange: true
    avgRating: true
    reviewCount: true
    verified: true
    badge: true
    createdAt: true
    venueCategories: {
      select: {
        category: {
          select: {
            id: true
            name: true
            slug: true
          }
        }
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    _count: {
      select: {
        events: true
      }
    }
  }
}>

export type VenueSelectOption = Prisma.VenueGetPayload<{
  select: {
    id: true
    name: true
    slug: true
  }
}>
