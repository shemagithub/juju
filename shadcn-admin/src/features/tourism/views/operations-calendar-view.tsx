import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { format, isSameMonth, parse } from 'date-fns'
import {
  CalendarRange,
  ChevronRight,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import {
  useBookingsQuery,
  useTourGuidesQuery,
  useTourPackagesQuery,
  useUsersApiQuery,
} from '../hooks/use-tourism-queries'

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

function statusBadgeVariant(
  s: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'confirmed') return 'default'
  if (s === 'pending') return 'secondary'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

const statusOptions = ['pending', 'confirmed', 'cancelled'] as const

export function OperationsCalendarView() {
  const qc = useQueryClient()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<Date | undefined>(() => new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewB, setViewB] = useState<Booking | null>(null)
  const [editB, setEditB] = useState<Booking | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const { data: bookings = [], isPending, refetch } = useBookingsQuery()
  const { data: packages = [] } = useTourPackagesQuery()
  const { data: users = [] } = useUsersApiQuery()
  const { data: guides = [] } = useTourGuidesQuery()

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

  const guideNameByBooking = useMemo(() => {
    const gMap: Record<string, string> = {}
    for (const g of guides as { id: string; userId: string }[]) {
      gMap[g.id] = userName[g.userId] ?? 'Guide'
    }
    return gMap
  }, [guides, userName])

  const list = useMemo(() => bookings as Booking[], [bookings])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return list
    return list.filter((b) => b.status === statusFilter)
  }, [list, statusFilter])

  const datesWithBookings = useMemo(() => {
    const seen = new Set<string>()
    const out: Date[] = []
    for (const b of filtered) {
      const key = b.startDate.slice(0, 10)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(parseLocalDate(key))
    }
    return out
  }, [filtered])

  const monthBookings = useMemo(() => {
    return filtered.filter((b) =>
      isSameMonth(parseLocalDate(b.startDate), month),
    )
  }, [filtered, month])

  const selectedBookings = useMemo(() => {
    if (!selected) return []
    return filtered.filter((b) =>
      isSameDayString(b.startDate, selected),
    )
  }, [filtered, selected])

  const pendingInMonth = useMemo(
    () => monthBookings.filter((b) => b.status === 'pending').length,
    [monthBookings],
  )

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

  return (
    <TourismAdminShell
      title='Operations calendar'
      description='See tour start dates at a glance. Data loads from your bookings API.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-4'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-xs'>Filter by status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='confirmed'>Confirmed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <CalendarRange className='size-5' />
                {format(month, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>
                Days with a dot have at least one booking (after filters). Click a day for details.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center gap-4 sm:flex-row sm:items-start'>
              {isPending ? (
                <p className='text-muted-foreground text-sm'>Loading calendar…</p>
              ) : (
                <Calendar
                  mode='single'
                  month={month}
                  onMonthChange={setMonth}
                  selected={selected}
                  onSelect={setSelected}
                  modifiers={{ hasBookings: datesWithBookings }}
                  modifiersClassNames={{
                    hasBookings:
                      'relative font-semibold after:absolute after:bottom-0.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary',
                  }}
                  className='rounded-lg border [--cell-size:2.5rem] md:[--cell-size:2.75rem]'
                />
              )}
              <div className='grid w-full gap-3 sm:max-w-xs'>
                <div className='bg-muted/50 rounded-lg border p-3 text-sm'>
                  <p className='text-muted-foreground text-xs'>This month</p>
                  <p className='text-2xl font-semibold tabular-nums'>
                    {monthBookings.length}
                    <span className='text-muted-foreground ms-1 text-sm font-normal'>
                      bookings
                    </span>
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {pendingInMonth} pending ·{' '}
                    {monthBookings.filter((b) => b.status === 'confirmed').length}{' '}
                    confirmed
                  </p>
                </div>
                <Button variant='secondary' asChild className='w-full'>
                  <Link to='/bookings'>
                    Open full bookings list
                    <ChevronRight className='ms-1 size-4' />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='h-fit lg:sticky lg:top-4'>
          <CardHeader>
            <CardTitle className='text-base'>
              {selected ? format(selected, 'EEEE, MMM d') : 'Pick a day'}
            </CardTitle>
            <CardDescription>
              {selectedBookings.length
                ? `${selectedBookings.length} booking(s) starting this day`
                : 'No bookings on this day (with current filters).'}
            </CardDescription>
          </CardHeader>
          <CardContent className='max-h-[min(420px,60vh)] space-y-3 overflow-y-auto'>
            {selectedBookings.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Try another date or clear the status filter.
              </p>
            ) : (
              selectedBookings.map((b) => (
                <div
                  key={b.id}
                  className='bg-muted/40 space-y-2 rounded-md border p-3 text-sm'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-medium'>
                      {pkgTitle[b.packageId] ?? 'Package'}
                    </span>
                    <div className='flex items-center gap-1'>
                      <Badge variant={statusBadgeVariant(b.status)}>
                        {b.status}
                      </Badge>
                      <ResourceRowActions
                        itemLabel={pkgTitle[b.packageId] ?? 'booking'}
                        onView={() => setViewB(b)}
                        onEdit={() => setEditB({ ...b })}
                      />
                    </div>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                    <Users className='size-3.5' />
                    {userName[b.userId] ?? b.userId.slice(0, 8)}
                  </div>
                  {b.guideId ? (
                    <p className='text-muted-foreground text-xs'>
                      Guide: {guideNameByBooking[b.guideId] ?? b.guideId}
                    </p>
                  ) : (
                    <p className='text-amber-600 text-xs dark:text-amber-500'>
                      No guide assigned
                    </p>
                  )}
                  <p className='text-muted-foreground text-xs'>
                    {b.totalRwf.toLocaleString()} RWF
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ResourceViewDialog
        open={!!viewB}
        onOpenChange={(o) => !o && setViewB(null)}
        title='Booking'
        description={
          viewB
            ? `${pkgTitle[viewB.packageId] ?? viewB.packageId} · ${userName[viewB.userId] ?? viewB.userId.slice(0, 8)}`
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
              <span className='text-muted-foreground'>Guide:</span>{' '}
              {viewB.guideId ? guideNameByBooking[viewB.guideId] ?? viewB.guideId : '—'}
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
              <Label htmlFor='cbsd'>Start date</Label>
              <Input
                id='cbsd'
                type='date'
                value={editB.startDate.slice(0, 10)}
                onChange={(e) => setEditB({ ...editB, startDate: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cbto'>Total (Rwf)</Label>
              <Input
                id='cbto'
                type='number'
                min={0}
                value={editB.totalRwf}
                onChange={(e) =>
                  setEditB({ ...editB, totalRwf: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cbst'>Status</Label>
              <select
                id='cbst'
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
              <Label htmlFor='cbg'>Guide</Label>
              <select
                id='cbg'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={editB.guideId ?? ''}
                onChange={(e) =>
                  setEditB({ ...editB, guideId: e.target.value || null })
                }
              >
                <option value=''>— Unassigned —</option>
                {(guides as { id: string; userId: string }[]).map((g) => (
                  <option key={g.id} value={g.id}>
                    {userName[g.userId] ?? g.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </ResourceEditDialog>
    </TourismAdminShell>
  )
}

function isSameDayString(ymd: string, day: Date): boolean {
  const d = parseLocalDate(ymd)
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  )
}
