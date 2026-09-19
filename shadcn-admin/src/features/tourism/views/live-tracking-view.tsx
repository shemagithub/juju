import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  addDays,
  format,
  isWithinInterval,
  parse,
  startOfDay,
} from 'date-fns'
import {
  ExternalLink,
  MapPin,
  Navigation,
  RefreshCw,
  Satellite,
} from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { BOOKING_STATUSES } from '../lib/status-options'
import {
  useBookingsQuery,
  useDestinationsQuery,
  useTourGuidesQuery,
  useTourPackagesQuery,
  useUsersApiQuery,
} from '../hooks/use-tourism-queries'

/** Rwanda overview — OpenStreetMap embed bbox: minLon, minLat, maxLon, maxLat */
const RWANDA_BBOX = '28.85,-2.85,30.95,-1.05'

type Booking = {
  id: string
  userId: string
  packageId: string
  startDate: string
  status: string
  totalRwf: number
  guideId: string | null
}

function parseLocalDate(ymd: string): Date {
  return parse(ymd.slice(0, 10), 'yyyy-MM-dd', new Date())
}

function bboxAround(lat: number, lng: number, pad = 0.35): string {
  const minLat = lat - pad
  const maxLat = lat + pad
  const minLng = lng - pad
  const maxLng = lng + pad
  return `${minLng},${minLat},${maxLng},${maxLat}`
}

function osmEmbedUrl(bbox: string): string {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`
}

const statusOptions = BOOKING_STATUSES

export function LiveTrackingView() {
  const qc = useQueryClient()
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [viewB, setViewB] = useState<Booking | null>(null)
  const [editB, setEditB] = useState<Booking | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteB, setDeleteB] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/bookings/${id}`, { status })
    },
    onSuccess: async () => {
      toast.success('Booking status updated — customer notified by email')
      await qc.invalidateQueries({ queryKey: ['bookings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const { data: destinations = [], isPending: destPending } =
    useDestinationsQuery()
  const { data: bookings = [], isPending: bookPending, refetch } =
    useBookingsQuery()
  const { data: packages = [] } = useTourPackagesQuery()
  const { data: users = [] } = useUsersApiQuery()
  const { data: guides = [] } = useTourGuidesQuery()

  const destList = useMemo(
    () =>
      destinations as {
        id: string
        name: string
        lat: number
        lng: number
      }[],
    [destinations],
  )

  const selectedDest = useMemo(
    () => destList.find((d) => d.id === selectedDestId) ?? null,
    [destList, selectedDestId],
  )

  const mapBbox = useMemo(() => {
    if (
      selectedDest &&
      Number.isFinite(selectedDest.lat) &&
      Number.isFinite(selectedDest.lng) &&
      (selectedDest.lat !== 0 || selectedDest.lng !== 0)
    ) {
      return bboxAround(selectedDest.lat, selectedDest.lng)
    }
    return RWANDA_BBOX
  }, [selectedDest])

  const pkgTitle = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of packages as { id: string; title: string }[]) {
      m[p.id] = p.title
    }
    return m
  }, [packages])

  const userName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const u of users as {
      id: string
      firstName: string
      lastName: string
    }[]) {
      m[u.id] = `${u.firstName} ${u.lastName}`.trim()
    }
    return m
  }, [users])

  const guideName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const g of guides as { id: string; userId: string }[]) {
      m[g.id] = userName[g.userId] ?? 'Guide'
    }
    return m
  }, [guides, userName])

  const list = useMemo(() => bookings as Booking[], [bookings])

  const today = startOfDay(new Date())
  /** Inclusive window: today through today + 6 (7 calendar days). */
  const weekEnd = addDays(today, 6)

  const todayStr = format(today, 'yyyy-MM-dd')

  const departuresToday = useMemo(() => {
    return list.filter(
      (b) =>
        b.startDate.slice(0, 10) === todayStr &&
        b.status !== 'cancelled',
    )
  }, [list, todayStr])

  const upcomingWeek = useMemo(() => {
    return list
      .filter((b) => {
        if (b.status === 'cancelled') return false
        const d = parseLocalDate(b.startDate)
        return isWithinInterval(d, { start: today, end: weekEnd })
      })
      .sort(
        (a, b) =>
          parseLocalDate(a.startDate).getTime() -
          parseLocalDate(b.startDate).getTime(),
      )
  }, [list, today, weekEnd])

  useEffect(() => {
    if (!autoRefresh) return
    const id = window.setInterval(() => {
      void refetch()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [autoRefresh, refetch])

  const userLabel = (id: string) => userName[id] ?? id.slice(0, 8)
  const guideLabel = (gid: string | null) => {
    if (!gid) return '—'
    return guideName[gid] ?? gid.slice(0, 8)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editB) return
    setEditSaving(true)
    try {
      await api.patch(`/api/bookings/${editB.id}`, {
        status: editB.status,
        guideId: editB.guideId,
        startDate: editB.startDate.slice(0, 10),
        totalRwf: editB.totalRwf,
      })
      toast.success('Booking saved')
      setEditB(null)
      await qc.invalidateQueries({ queryKey: ['bookings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteB) return
    setDeleting(true)
    try {
      await api.delete(`/api/bookings/${deleteB.id}`)
      toast.success('Booking deleted')
      setDeleteB(null)
      await qc.invalidateQueries({ queryKey: ['bookings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  const loading = destPending || bookPending

  return (
    <TourismAdminShell
      title='Live tracking'
      description='Destinations on the map, plus today’s departures from bookings.'
      actions={
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Switch
              id='auto-refresh'
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor='auto-refresh' className='text-sm font-normal'>
              Auto-refresh (60s)
            </Label>
          </div>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh now
          </Button>
        </div>
      }
    >
      <div className='grid gap-6 xl:grid-cols-[1fr_minmax(0,380px)]'>
        <div className='space-y-4'>
          <Card className='overflow-hidden p-0'>
            <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Satellite className='size-4' />
                Map preview
              </div>
              {selectedDest && (
                <a
                  className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
                  href={`https://www.openstreetmap.org/?mlat=${selectedDest.lat}&mlon=${selectedDest.lng}#map=12/${selectedDest.lat}/${selectedDest.lng}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  Open in OpenStreetMap
                  <ExternalLink className='size-3' />
                </a>
              )}
            </div>
            <div className='bg-muted relative aspect-[16/10] w-full'>
              {loading ? (
                <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
                  Loading map…
                </div>
              ) : (
                <iframe
                  title='Destination map'
                  className='absolute inset-0 h-full w-full border-0'
                  src={osmEmbedUrl(mapBbox)}
                  loading='lazy'
                  referrerPolicy='no-referrer-when-downgrade'
                />
              )}
            </div>
            <CardContent className='pt-4'>
              <Label className='text-muted-foreground mb-2 block text-xs'>
                Focus destination
              </Label>
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant={selectedDestId === null ? 'default' : 'outline'}
                  onClick={() => setSelectedDestId(null)}
                >
                  All Rwanda
                </Button>
                {destList.map((d) => (
                  <Button
                    key={d.id}
                    size='sm'
                    variant={selectedDestId === d.id ? 'default' : 'outline'}
                    onClick={() => setSelectedDestId(d.id)}
                  >
                    {d.name}
                  </Button>
                ))}
              </div>
              {destList.length === 0 && !destPending && (
                <p className='text-muted-foreground mt-2 text-xs'>
                  Add destinations under{' '}
                  <Link className='text-primary underline' to='/destinations'>
                    Destinations
                  </Link>{' '}
                  with latitude & longitude for map focus.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Navigation className='size-4' />
                Today’s departures
              </CardTitle>
              <CardDescription>
                Confirmed or pending tours starting {format(today, 'MMM d, yyyy')}.
              </CardDescription>
            </CardHeader>
            <CardContent className='min-w-0'>
              {departuresToday.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No active departures today. Check the week view below.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour</TableHead>
                      <TableHead>Guest / guide</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departuresToday.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className='max-w-[160px] truncate text-sm font-medium'>
                          {pkgTitle[b.packageId] ?? 'Tour'}
                        </TableCell>
                        <TableCell className='text-muted-foreground max-w-[200px] truncate text-xs'>
                          {userName[b.userId] ?? 'Guest'} ·{' '}
                          {b.guideId ? guideName[b.guideId] : 'Guide not assigned'}
                        </TableCell>
                        <TableCell>
                          <AdminStatusSelect
                            value={b.status}
                            options={statusOptions}
                            disabled={updateStatus.isPending}
                            onChange={(status) =>
                              updateStatus.mutate({ id: b.id, status })
                            }
                          />
                        </TableCell>
                        <TableCell className='text-right'>
                          <ResourceRowActions
                            itemLabel={pkgTitle[b.packageId] ?? 'booking'}
                            onView={() => setViewB(b)}
                            onEdit={() => setEditB({ ...b })}
                            onDelete={() => setDeleteB(b)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Next 7 days (incl. today)</CardTitle>
              <CardDescription>
                Seven-day window including today — assign guides from{' '}
                <Link className='text-primary underline' to='/bookings'>
                  Bookings
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className='px-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingWeek.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-muted-foreground text-center text-sm'
                      >
                        No bookings in the next week.
                      </TableCell>
                    </TableRow>
                  ) : (
                    upcomingWeek.slice(0, 12).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className='whitespace-nowrap text-xs'>
                          {b.startDate.slice(0, 10)}
                        </TableCell>
                        <TableCell className='max-w-[140px] truncate text-xs'>
                          {pkgTitle[b.packageId] ?? '—'}
                        </TableCell>
                        <TableCell>
                          <AdminStatusSelect
                            value={b.status}
                            options={statusOptions}
                            disabled={updateStatus.isPending}
                            onChange={(status) =>
                              updateStatus.mutate({ id: b.id, status })
                            }
                          />
                        </TableCell>
                        <TableCell className='text-right'>
                          <ResourceRowActions
                            itemLabel={pkgTitle[b.packageId] ?? 'booking'}
                            onView={() => setViewB(b)}
                            onEdit={() => setEditB({ ...b })}
                            onDelete={() => setDeleteB(b)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {upcomingWeek.length > 12 && (
                <p className='text-muted-foreground px-4 pb-2 text-xs'>
                  +{upcomingWeek.length - 12} more — open bookings for full list.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <MapPin className='size-4' />
                GPS integration
              </CardTitle>
              <CardDescription>
                When you connect driver or vehicle trackers, plot live positions on this map using the same destination coordinates as reference points.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <ResourceViewDialog
        open={!!viewB}
        onOpenChange={(o) => !o && setViewB(null)}
        title='Booking'
        description={
          viewB
            ? `${pkgTitle[viewB.packageId] ?? viewB.packageId} · ${userLabel(viewB.userId)}`
            : undefined
        }
        onEdit={viewB ? () => setEditB({ ...viewB }) : undefined}
      >
        {viewB ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Start:</span> {viewB.startDate}
            </p>
            <p>
              <span className='text-muted-foreground'>Total:</span>{' '}
              {viewB.totalRwf?.toLocaleString()} Rwf
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span> {viewB.status}
            </p>
            <p>
              <span className='text-muted-foreground'>Guide:</span> {guideLabel(viewB.guideId)}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editB}
        onOpenChange={(o) => !o && setEditB(null)}
        title='Edit booking'
        itemName={editB ? pkgTitle[editB.packageId] : undefined}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editB ? (
          <>
            <div className='space-y-2'>
              <Label htmlFor='ltsd'>Start date</Label>
              <Input
                id='ltsd'
                type='date'
                value={editB.startDate.slice(0, 10)}
                onChange={(e) => setEditB({ ...editB, startDate: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ltto'>Total (Rwf)</Label>
              <Input
                id='ltto'
                type='number'
                min={0}
                value={editB.totalRwf}
                onChange={(e) =>
                  setEditB({ ...editB, totalRwf: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ltst'>Status</Label>
              <select
                id='ltst'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={editB.status}
                onChange={(e) => setEditB({ ...editB, status: e.target.value })}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ltg'>Guide</Label>
              <select
                id='ltg'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={editB.guideId ?? ''}
                onChange={(e) =>
                  setEditB({ ...editB, guideId: e.target.value || null })
                }
              >
                <option value=''>— Unassigned —</option>
                {(guides as { id: string; userId: string }[]).map((g) => (
                  <option key={g.id} value={g.id}>
                    {guideLabel(g.id)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteB}
        onOpenChange={(o) => !o && setDeleteB(null)}
        title='Delete booking?'
        desc={<span>Permanently remove this booking record.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
