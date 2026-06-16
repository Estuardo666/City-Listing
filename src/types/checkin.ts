export type CheckInWithUser = {
  id: string
  photoUrl: string | null
  note: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

export type CheckInPhoto = CheckInWithUser & {
  photoUrl: string
}
