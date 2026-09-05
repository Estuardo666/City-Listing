'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getGooglePhoto, invalidateGooglePhoto, type GooglePhoto as Photo } from '@/lib/google/photo-cache'

/** Live display only: no persistent URL cache and no Next image optimizer. */
export function GoogleVenuePhoto({ slug, name, large = false }: { slug: string; name: string; large?: boolean }) {
  const size = large ? 'large' : 'small'
  const container = useRef<HTMLDivElement>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setPhoto(null)
    setReady(false)
    // The request is shared through the cache, so it cannot be aborted on
    // unmount without cancelling it for other viewers. Drop the result instead.
    let active = true
    let requested = false
    const load = async () => {
      if (requested) return
      requested = true
      try {
        const result = await getGooglePhoto(slug, size)
        if (active) setPhoto(result)
      } catch { /* Keep the existing fallback. */ }
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        void load()
      }
    })
    if (container.current) observer.observe(container.current)
    return () => { observer.disconnect(); active = false }
  }, [slug, size])

  return (
    <div ref={container} className="pointer-events-none absolute inset-0" onClick={(event) => event.stopPropagation()}>
      {photo && <>
        {/* Google serves the image directly; do not route it through /_next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.photoUri} alt={name} className={`h-full w-full object-cover ${ready ? '' : 'invisible'}`}
          onLoad={() => setReady(true)}
          onError={() => { invalidateGooglePhoto(slug, size); setPhoto(null); setReady(false) }} />
        {ready && <button type="button" translate="no"
          className="pointer-events-auto absolute bottom-1 right-1 z-20 whitespace-nowrap rounded bg-white px-1.5 py-1 font-sans text-xs font-normal not-italic tracking-normal text-[#1F1F1F] shadow"
          aria-label={`Ver foto de ${name} y atribución de Google Maps`}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true) }}>
          Google Maps
        </button>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <DialogTitle>Foto de {name}</DialogTitle>
            <DialogDescription>Foto proporcionada por Google Maps.</DialogDescription>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.photoUri} alt={name} className="max-h-[65vh] w-full object-contain" />
            <div className="space-y-2 text-sm">
              {photo.authors.map((author, index) => <div key={index} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {author.photoUri && <img src={author.photoUri} alt="" className="h-8 w-8 rounded-full" />}
                {author.uri ? <a href={author.uri} target="_blank" rel="noopener noreferrer" className="underline">{author.displayName}</a> : <span>{author.displayName}</span>}
              </div>)}
              <a href={photo.googleMapsUri} target="_blank" rel="noopener noreferrer" className="inline-block underline">Ver foto original en <span translate="no">Google Maps</span></a>
            </div>
          </DialogContent>
        </Dialog>
      </>}
    </div>
  )
}
