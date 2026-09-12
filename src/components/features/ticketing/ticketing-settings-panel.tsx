'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Map, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Account = {
  id: string
  provider: string
  storeId: string
  displayName: string | null
  status: string
  capabilities: Record<string, unknown> | null
}

type TicketType = {
  id?: string
  slug: string
  name: string
  description: string | null
  kind: 'GENERAL' | 'NUMBERED' | 'ASSIGNED_SEAT'
  priceCents: number
  capacity: number | null
  minPerOrder: number
  maxPerOrder: number
  sortOrder: number
  isActive: boolean
}

type Seat = {
  id: string
  seatKey: string
  section: string | null
  rowLabel: string | null
  seatNumber: string
  x: number
  y: number
  status: string
  ticketTypeId: string | null
}

type ManagedData = {
  capabilities: { eventTicketingEnabled: boolean; seatMapsEnabled: boolean }
  config: {
    id: string
    mode: 'NONE' | 'INTERNAL' | 'EXTERNAL'
    sellerType: 'PLATFORM' | 'ORGANIZER'
    paymentAccountId: string | null
    externalUrl: string | null
    externalProviderLabel: string | null
    feeIncidence: 'NONE' | 'BUYER_PAYS' | 'ORGANIZER_ABSORBS'
    feePercentBps: number
    feeFixedCents: number
    salesStartAt: string | null
    salesEndAt: string | null
    status: string
    ticketTypes: TicketType[]
    seatMap: { id: string; version: number; name: string; seats: Seat[] } | null
  } | null
}

type DraftType = TicketType & { price: string; capacityValue: string }

function defaultType(): DraftType {
  return { slug: 'general', name: 'General', description: null, kind: 'GENERAL', priceCents: 0, price: '0.00', capacity: null, capacityValue: '', minPerOrder: 1, maxPerOrder: 10, sortOrder: 0, isActive: true }
}

function toDraft(type: TicketType): DraftType {
  return { ...type, price: (type.priceCents / 100).toFixed(2), capacityValue: type.capacity === null ? '' : String(type.capacity) }
}

function integerMoney(value: string) {
  const normalized = value.replace(',', '.').trim()
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const [whole, decimals = ''] = normalized.split('.')
  return Number(whole) * 100 + Number(decimals.padEnd(2, '0'))
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return body?.error?.message ?? 'No se pudo guardar la configuración.'
}

export function TicketingSettingsPanel({ eventId, isAdmin = false }: { eventId: string; isAdmin?: boolean }) {
  const [managed, setManaged] = useState<ManagedData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [types, setTypes] = useState<DraftType[]>([defaultType()])
  const [mode, setMode] = useState<'NONE' | 'INTERNAL' | 'EXTERNAL'>('NONE')
  const [sellerType, setSellerType] = useState<'PLATFORM' | 'ORGANIZER'>('ORGANIZER')
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [externalProviderLabel, setExternalProviderLabel] = useState('')
  const [feeIncidence, setFeeIncidence] = useState<'NONE' | 'BUYER_PAYS' | 'ORGANIZER_ABSORBS'>('NONE')
  const [feePercent, setFeePercent] = useState('0')
  const [feeFixed, setFeeFixed] = useState('0.00')
  const [salesStartAt, setSalesStartAt] = useState('')
  const [salesEndAt, setSalesEndAt] = useState('')
  const [status, setStatus] = useState('READY')
  const [storeId, setStoreId] = useState('')
  const [token, setToken] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [mapName, setMapName] = useState('Mapa principal')
  const [mapSection, setMapSection] = useState('')
  const [mapRows, setMapRows] = useState('A,B,C,D')
  const [seatsPerRow, setSeatsPerRow] = useState('10')
  const [mapTypeId, setMapTypeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [configResponse, accountsResponse] = await Promise.all([
        fetch(`/api/dashboard/events/${eventId}/ticketing`, { cache: 'no-store' }),
        fetch('/api/dashboard/payment-accounts', { cache: 'no-store' }),
      ])
      if (!configResponse.ok) throw new Error(await readError(configResponse))
      const configBody = await configResponse.json() as { data: ManagedData }
      const accountsBody = accountsResponse.ok ? await accountsResponse.json() as { data: Account[] } : { data: [] }
      setManaged(configBody.data)
      setAccounts(accountsBody.data)
      const config = configBody.data.config
      if (config) {
        setMode(config.mode)
        setSellerType(config.sellerType)
        setPaymentAccountId(config.paymentAccountId ?? '')
        setExternalUrl(config.externalUrl ?? '')
        setExternalProviderLabel(config.externalProviderLabel ?? '')
        setFeeIncidence(config.feeIncidence)
        setFeePercent(String(config.feePercentBps / 100))
        setFeeFixed((config.feeFixedCents / 100).toFixed(2))
        setSalesStartAt(config.salesStartAt ? new Date(config.salesStartAt).toISOString().slice(0, 16) : '')
        setSalesEndAt(config.salesEndAt ? new Date(config.salesEndAt).toISOString().slice(0, 16) : '')
        setStatus(config.status)
        setTypes(config.ticketTypes.length ? config.ticketTypes.map(toDraft) : [defaultType()])
        const assigned = config.ticketTypes.find((type) => type.kind === 'ASSIGNED_SEAT')
        if (assigned) setMapTypeId(assigned.id ?? '')
        if (config.seatMap) setMapName(config.seatMap.name)
      }
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la configuración.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [eventId])

  const assignedTypes = useMemo(() => types.filter((type) => type.kind === 'ASSIGNED_SEAT' && type.id), [types])

  const saveConfig = async () => {
    setSaving(true)
    setError(null)
    try {
      const percent = Number(feePercent.replace(',', '.'))
      const fixed = integerMoney(feeFixed)
      if (!Number.isFinite(percent) || percent < 0 || percent > 100 || fixed === null) throw new Error('La comisión debe ser válida.')
      const response = await fetch(`/api/dashboard/events/${eventId}/ticketing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, sellerType, paymentAccountId: mode === 'INTERNAL' && sellerType === 'ORGANIZER' ? paymentAccountId || null : null, externalUrl: mode === 'EXTERNAL' ? externalUrl || null : null, externalProviderLabel: mode === 'EXTERNAL' ? externalProviderLabel || null : null, feeIncidence: mode === 'INTERNAL' ? feeIncidence : 'NONE', feePercentBps: mode === 'INTERNAL' ? Math.round(percent * 100) : 0, feeFixedCents: mode === 'INTERNAL' ? fixed : 0, salesStartAt: salesStartAt ? new Date(salesStartAt).toISOString() : null, salesEndAt: salesEndAt ? new Date(salesEndAt).toISOString() : null, status }) })
      if (!response.ok) throw new Error(await readError(response))
      toast.success('Configuración de entradas guardada')
      await load()
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'No se pudo guardar la configuración.'
      setError(text)
      toast.error(text)
    } finally {
      setSaving(false)
    }
  }

  const saveTypes = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = types.map((type, index) => {
        const priceCents = integerMoney(type.price)
        if (priceCents === null) throw new Error(`El precio de ${type.name || 'un boleto'} no es válido.`)
        const capacity = type.capacityValue.trim() ? Number(type.capacityValue) : null
        if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) throw new Error(`El cupo de ${type.name || 'un boleto'} no es válido.`)
        return { id: type.id, slug: type.slug, name: type.name, description: type.description, kind: type.kind, priceCents, capacity, minPerOrder: type.minPerOrder, maxPerOrder: type.maxPerOrder, sortOrder: index, isActive: type.isActive }
      })
      const response = await fetch(`/api/dashboard/events/${eventId}/ticketing/types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ types: payload }) })
      if (!response.ok) throw new Error(await readError(response))
      toast.success('Tipos de boleto guardados')
      await load()
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'No se pudieron guardar los boletos.'
      setError(text)
      toast.error(text)
    } finally {
      setSaving(false)
    }
  }

  const saveAccount = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/payment-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, token, displayName: displayName || null }) })
      if (!response.ok) throw new Error(await readError(response))
      setToken('')
      toast.success('Cuenta PayPhone conectada')
      await load()
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'No se pudo conectar PayPhone.'
      setError(text)
      toast.error(text)
    } finally {
      setSaving(false)
    }
  }

  const saveMap = async () => {
    setSaving(true)
    setError(null)
    try {
      const rowValues = mapRows.split(',').map((row) => row.trim()).filter(Boolean)
      const count = Number(seatsPerRow)
      if (!rowValues.length || !Number.isInteger(count) || count < 1 || count > 200) throw new Error('Define filas y un número de asientos entre 1 y 200.')
      const seats = rowValues.flatMap((row, rowIndex) => Array.from({ length: count }, (_, index) => ({ seatKey: `${mapSection ? `${mapSection}-` : ''}${row}-${index + 1}`, section: mapSection || null, rowLabel: row, seatNumber: String(index + 1), x: index, y: rowIndex, ticketTypeId: mapTypeId || null })))
      const response = await fetch(`/api/dashboard/events/${eventId}/ticketing/seats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: mapName, seats }) })
      if (!response.ok) throw new Error(await readError(response))
      toast.success('Mapa de asientos publicado')
      await load()
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'No se pudo guardar el mapa.'
      setError(text)
      toast.error(text)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl border border-border/60 bg-muted" />
  if (!managed) return <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error ?? 'No se pudo cargar la boletería.'}</p>

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-foreground">Cobro de entradas</h2><p className="mt-1 text-sm text-muted-foreground">Elige si Vive Loja vende las entradas o si solo enlaza al proveedor externo.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="ticketing-mode">Modalidad</Label><select id="ticketing-mode" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="NONE">Sin venta de entradas</option><option value="INTERNAL" disabled={!managed.capabilities.eventTicketingEnabled && !isAdmin}>Venta dentro de Vive Loja</option><option value="EXTERNAL">Enlace externo</option></select></div>
          <div><Label htmlFor="ticketing-status">Estado</Label><select id="ticketing-status" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="DRAFT">Borrador</option><option value="READY">Listo</option><option value="ON_SALE">En venta</option><option value="PAUSED">Pausado</option><option value="ENDED">Finalizado</option></select></div>
        </div>
        {mode === 'INTERNAL' && <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4"><div><Label htmlFor="ticketing-seller">Quién recibe el cobro</Label><select id="ticketing-seller" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={sellerType} onChange={(event) => setSellerType(event.target.value as typeof sellerType)}><option value="ORGANIZER">La cuenta PayPhone del organizador</option>{isAdmin && <option value="PLATFORM">Cuenta central de Vive Loja</option>}</select></div>{sellerType === 'ORGANIZER' && <div><Label htmlFor="ticketing-account">Cuenta PayPhone</Label><select id="ticketing-account" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={paymentAccountId} onChange={(event) => setPaymentAccountId(event.target.value)}><option value="">Selecciona una cuenta conectada</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.displayName || 'PayPhone'} · Store {account.storeId}</option>)}</select>{!accounts.length && <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">Conecta una cuenta PayPhone abajo antes de publicar la venta.</p>}</div>}</div>}
        {mode === 'EXTERNAL' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="ticketing-external-url">URL de compra</Label><Input id="ticketing-external-url" className="mt-1.5" type="url" placeholder="https://…" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /></div><div><Label htmlFor="ticketing-provider-label">Proveedor / sitio</Label><Input id="ticketing-provider-label" className="mt-1.5" placeholder="Ej. TicketShow" value={externalProviderLabel} onChange={(event) => setExternalProviderLabel(event.target.value)} /></div></div>}
        {mode === 'INTERNAL' && <><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><Label htmlFor="ticketing-fee-incidence">Comisión</Label><select id="ticketing-fee-incidence" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={feeIncidence} onChange={(event) => setFeeIncidence(event.target.value as typeof feeIncidence)}><option value="NONE">Sin comisión</option><option value="BUYER_PAYS">La paga el comprador</option><option value="ORGANIZER_ABSORBS">La asume el organizador</option></select></div><div><Label htmlFor="ticketing-fee-percent">Porcentaje (%)</Label><Input id="ticketing-fee-percent" className="mt-1.5" type="number" min="0" max="100" step="0.01" value={feePercent} onChange={(event) => setFeePercent(event.target.value)} /></div><div><Label htmlFor="ticketing-fee-fixed">Fijo (USD)</Label><Input id="ticketing-fee-fixed" className="mt-1.5" type="number" min="0" step="0.01" value={feeFixed} onChange={(event) => setFeeFixed(event.target.value)} /></div></div><p className="mt-2 text-xs text-muted-foreground">Con una cuenta de organizador, la comisión se fuerza a cero hasta que PayPhone habilite revenue share para esa cuenta.</p></>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="ticketing-sales-start">Inicio de venta</Label><Input id="ticketing-sales-start" className="mt-1.5" type="datetime-local" value={salesStartAt} onChange={(event) => setSalesStartAt(event.target.value)} /></div><div><Label htmlFor="ticketing-sales-end">Fin de venta</Label><Input id="ticketing-sales-end" className="mt-1.5" type="datetime-local" value={salesEndAt} onChange={(event) => setSalesEndAt(event.target.value)} /></div></div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button type="button" className="mt-5" onClick={saveConfig} disabled={saving}><Save className="mr-2 h-4 w-4" />Guardar cobro</Button>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Tipos de boleto</h2><p className="mt-1 text-sm text-muted-foreground">Define precio, cupo y límites por compra.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setTypes((current) => [...current, { ...defaultType(), slug: `general-${current.length + 1}`, name: `General ${current.length + 1}`, sortOrder: current.length }])}><Plus className="mr-2 h-4 w-4" />Agregar</Button></div>
        <div className="mt-5 space-y-4">{types.map((type, index) => <div key={type.id ?? `new-${index}`} className="rounded-xl border border-border/60 p-4"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_150px_130px_auto]"><div><Label>Nombre</Label><Input className="mt-1.5" value={type.name} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></div><div><Label>Slug</Label><Input className="mt-1.5" value={type.slug} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } : item))} /></div><div><Label>Precio USD</Label><Input className="mt-1.5" type="number" min="0" step="0.01" value={type.price} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} /></div><div><Label>Cupo</Label><Input className="mt-1.5" type="number" min="1" placeholder="Ilimitado" value={type.capacityValue} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, capacityValue: event.target.value } : item))} /></div><Button type="button" variant="ghost" size="icon" className="mt-6 text-destructive" onClick={() => setTypes((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} aria-label={`Eliminar ${type.name}`}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><Label>Modalidad</Label><select className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={type.kind} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, kind: event.target.value as DraftType['kind'] } : item))}><option value="GENERAL">General</option><option value="NUMBERED">Numerado</option><option value="ASSIGNED_SEAT" disabled={!managed.capabilities.seatMapsEnabled && !isAdmin}>Asiento asignado</option></select></div><div><Label>Mínimo por orden</Label><Input className="mt-1.5" type="number" min="1" max="10" value={type.minPerOrder} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, minPerOrder: Number(event.target.value) } : item))} /></div><div><Label>Máximo por orden</Label><Input className="mt-1.5" type="number" min="1" max="10" value={type.maxPerOrder} onChange={(event) => setTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, maxPerOrder: Number(event.target.value) } : item))} /></div></div></div>)}</div>
        <Button type="button" className="mt-5" onClick={saveTypes} disabled={saving || mode !== 'INTERNAL'}><Save className="mr-2 h-4 w-4" />Guardar boletos</Button>{mode !== 'INTERNAL' && <p className="mt-2 text-xs text-muted-foreground">Activa la venta interna y guarda el cobro antes de definir boletos.</p>}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40"><KeyRound className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-foreground">Cuenta PayPhone del organizador</h2><p className="mt-1 text-sm text-muted-foreground">El token se cifra en el servidor y nunca se vuelve a mostrar. Usa credenciales de producción solo en producción.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><Label htmlFor="payphone-store">Store ID</Label><Input id="payphone-store" className="mt-1.5" value={storeId} onChange={(event) => setStoreId(event.target.value)} /></div><div><Label htmlFor="payphone-token">Token</Label><Input id="payphone-token" className="mt-1.5" type="password" autoComplete="new-password" value={token} onChange={(event) => setToken(event.target.value)} /></div><div><Label htmlFor="payphone-name">Nombre visible</Label><Input id="payphone-name" className="mt-1.5" placeholder="Mi PayPhone" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div></div><Button type="button" variant="outline" className="mt-4" onClick={saveAccount} disabled={saving || !storeId.trim() || token.trim().length < 12}><KeyRound className="mr-2 h-4 w-4" />Conectar cuenta</Button>{accounts.length > 0 && <div className="mt-4 space-y-2">{accounts.map((account) => <p key={account.id} className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{account.displayName || 'PayPhone'} · Store {account.storeId} · <span className="font-semibold text-emerald-700 dark:text-emerald-400">{account.status}</span></p>)}</div>}</section>

      {mode === 'INTERNAL' && managed.capabilities.seatMapsEnabled && assignedTypes.length > 0 && <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40"><Map className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-foreground">Mapa visual de asientos</h2><p className="mt-1 text-sm text-muted-foreground">Crea una cuadrícula. Los asientos publicados quedan disponibles para selección en la compra.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="seat-map-name">Nombre del mapa</Label><Input id="seat-map-name" className="mt-1.5" value={mapName} onChange={(event) => setMapName(event.target.value)} /></div><div><Label htmlFor="seat-map-type">Tipo de boleto asociado</Label><select id="seat-map-type" className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={mapTypeId} onChange={(event) => setMapTypeId(event.target.value)}><option value="">Todos los tipos de asiento</option>{assignedTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></div><div><Label htmlFor="seat-map-section">Sección <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="seat-map-section" className="mt-1.5" placeholder="VIP" value={mapSection} onChange={(event) => setMapSection(event.target.value)} /></div><div><Label htmlFor="seat-map-rows">Filas separadas por coma</Label><Input id="seat-map-rows" className="mt-1.5" value={mapRows} onChange={(event) => setMapRows(event.target.value)} /></div><div><Label htmlFor="seat-map-count">Asientos por fila</Label><Input id="seat-map-count" className="mt-1.5" type="number" min="1" max="200" value={seatsPerRow} onChange={(event) => setSeatsPerRow(event.target.value)} /></div></div><Button type="button" className="mt-5" onClick={saveMap} disabled={saving || !mapName.trim()}><Map className="mr-2 h-4 w-4" />Publicar mapa</Button>{managed.config?.seatMap && <p className="mt-3 text-xs text-muted-foreground">Mapa publicado: versión {managed.config.seatMap.version} · {managed.config.seatMap.seats.length} asientos. Publicar uno nuevo reemplaza el anterior cuando no hay reservas.</p>}</section>}
    </div>
  )
}
