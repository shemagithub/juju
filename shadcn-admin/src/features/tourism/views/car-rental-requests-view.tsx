import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CarFront, ChevronLeft, ChevronRight, Download, Mail, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FilterField, FilterToolbar } from '@/components/shared/filter-toolbar'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { CAR_RENTAL_STATUSES } from '../lib/status-options'
import {
  type CarRentalRequestListParams,
  useCarRentalRequestsQuery,
  useCarRentalRequestsSummaryQuery,
  useCarRentalVehiclesQuery,
} from '../hooks/use-tourism-queries'

type Extras = {
  childSeat?: boolean
  rooftopBox?: boolean
  additionalDriver?: boolean
}

type CarReq = {
  id: string
  name: string
  email: string
  phone: string
  vehicleClass: string
  pickupDate: string
  returnDate: string
  pickupLocation: string
  returnLocation: string
  driverOption: string
  extras: Extras
  message: string
  status: string
  adminNotes: string
  read: boolean
  createdAt: string
}

const statusVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'default',
  contacted: 'secondary',
  quoted: 'secondary',
  confirmed: 'outline',
  declined: 'destructive',
  cancelled: 'destructive',
}

const PAGE_SZ = 12

function csvEscape(v: unknown) {
  const s = String(v ?? '')
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function whatsappHref(phone: string, body: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`
}

export function TourismCarRentalRequestsPage({
  statusFilter,
}: {
  statusFilter?: 'pending'
}) {
  const qc = useQueryClient()
  const { data: summary } = useCarRentalRequestsSummaryQuery()
  const { data: fleetForClasses = [] } = useCarRentalVehiclesQuery({})

  const [qInput, setQInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(qInput.trim()), 320)
    return () => window.clearTimeout(t)
  }, [qInput])

  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [vehicleClass, setVehicleClass] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const listParams: CarRentalRequestListParams = useMemo(() => {
    const p: CarRentalRequestListParams = { limit: 500 }
    if (statusFilter === 'pending') p.status = 'pending'
    else if (workflowFilter !== 'all') p.status = workflowFilter
    if (readFilter === 'unread') p.read = 'false'
    else if (readFilter === 'read') p.read = 'true'
    if (vehicleClass !== 'all') p.vehicleClass = vehicleClass
    if (debouncedQ) p.q = debouncedQ
    if (fromDate) p.fromDate = fromDate
    if (toDate) p.toDate = toDate
    return p
  }, [
    statusFilter,
    workflowFilter,
    readFilter,
    vehicleClass,
    debouncedQ,
    fromDate,
    toDate,
  ])

  const { data = [], isPending, refetch, isFetching } = useCarRentalRequestsQuery(listParams)

  useEffect(() => {
    setPage(1)
  }, [listParams])

  const slugOptions = useMemo(() => {
    const slugs = new Set<string>()
    for (const v of fleetForClasses as { slug?: string }[]) {
      if (v.slug) slugs.add(String(v.slug))
    }
    return [...slugs].sort()
  }, [fleetForClasses])

  const rows = data as CarReq[]
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SZ))
  const safePage = Math.min(page, pageCount)
  const pageRows = rows.slice((safePage - 1) * PAGE_SZ, safePage * PAGE_SZ)

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const [viewR, setViewR] = useState<CarReq | null>(null)
  const [editR, setEditR] = useState<CarReq | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteR, setDeleteR] = useState<CarReq | null>(null)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/car-rental-requests/${id}`, { status, read: true })
    },
    onSuccess: async () => {
      toast.success('Status updated — customer notified by email')
      await qc.invalidateQueries({ queryKey: ['car-rental-requests'] })
      await qc.invalidateQueries({ queryKey: ['car-rental-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const mark = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      await api.patch(`/api/car-rental-requests/${id}`, { read })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['car-rental-requests'] })
      qc.invalidateQueries({ queryKey: ['car-rental-requests-summary'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      toast.success('Updated')
    },
    onError: handleServerError,
  })

  const bulkRead = useMutation({
    mutationFn: async ({ ids, read }: { ids: string[]; read: boolean }) => {
      await api.post('/api/car-rental-requests/bulk-read', { ids, read })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['car-rental-requests'] })
      qc.invalidateQueries({ queryKey: ['car-rental-requests-summary'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      toast.success('Requests updated')
    },
    onError: handleServerError,
  })

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editR) return
    setEditSaving(true)
    try {
      await api.patch(`/api/car-rental-requests/${editR.id}`, {
        status: editR.status,
        adminNotes: editR.adminNotes,
        read: editR.read,
      })
      toast.success('Request saved')
      setEditR(null)
      await qc.invalidateQueries({ queryKey: ['car-rental-requests'] })
      await qc.invalidateQueries({ queryKey: ['car-rental-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteR) return
    setDeleting(true)
    try {
      await api.delete(`/api/car-rental-requests/${deleteR.id}`)
      toast.success('Request deleted')
      setDeleteR(null)
      await qc.invalidateQueries({ queryKey: ['car-rental-requests'] })
      await qc.invalidateQueries({ queryKey: ['car-rental-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  const extrasLabel = (x: Extras) => {
    const parts: string[] = []
    if (x.childSeat) parts.push('Child seat')
    if (x.rooftopBox) parts.push('Roof box')
    if (x.additionalDriver) parts.push('Extra driver')
    return parts.length ? parts.join(', ') : '—'
  }

  const clearFilters = () => {
    setQInput('')
    setDebouncedQ('')
    setWorkflowFilter('all')
    setReadFilter('all')
    setVehicleClass('all')
    setFromDate('')
    setToDate('')
  }

  const exportCsv = () => {
    const header = [
      'id',
      'createdAt',
      'status',
      'read',
      'name',
      'email',
      'phone',
      'vehicleClass',
      'pickupDate',
      'returnDate',
      'pickupLocation',
      'returnLocation',
      'driverOption',
      'extras',
      'message',
      'adminNotes',
    ]
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.createdAt,
          r.status,
          r.read ? 'read' : 'unread',
          r.name,
          r.email,
          r.phone,
          r.vehicleClass,
          r.pickupDate,
          r.returnDate,
          r.pickupLocation,
          r.returnLocation,
          r.driverOption,
          extrasLabel(r.extras ?? {}),
          r.message?.replace(/\r?\n/g, ' ') ?? '',
          r.adminNotes?.replace(/\r?\n/g, ' ') ?? '',
        ]
          .map(csvEscape)
          .join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `car-rental-requests-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export started')
  }

  const title =
    statusFilter === 'pending' ? 'Pending quotes' : 'Quote requests'

  const mailHref = (r: CarReq) => {
    const sub = encodeURIComponent(`Car hire quote (${r.pickupDate} → ${r.returnDate})`)
    const body = encodeURIComponent(
      `Hi ${r.name},\n\nThanks for your enquiry for ${r.vehicleClass} from ${r.pickupDate}.`,
    )
    return `mailto:${r.email}?subject=${sub}&body=${body}`
  }

  return (
    <TourismAdminShell
      title={title}
      description='People asking to rent a car. Open one to quote or confirm.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className={`me-1 size-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant='outline' size='sm' onClick={exportCsv} disabled={!rows.length}>
            <Download className='me-1 size-4' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/car-rental/vehicles'>
              <CarFront className='me-1 size-4' />
              Fleet vehicles
            </Link>
          </Button>
          {statusFilter !== 'pending' ? (
            <Button variant='outline' size='sm' asChild>
              <Link to='/car-rental/pending'>Pending only</Link>
            </Button>
          ) : (
            <Button variant='outline' size='sm' asChild>
              <Link to='/car-rental'>All requests</Link>
            </Button>
          )}
        </div>
      }
    >
      {summary ? (
        <div className='mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Total leads</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-semibold tabular-nums'>
              {summary.total}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Unread</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-semibold tabular-nums'>
              {summary.unread}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-semibold tabular-nums'>
              {summary.byStatus?.pending ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Filtered rows</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-semibold tabular-nums'>
              {rows.length}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Search a name, then open the request to quote or confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <FilterToolbar>
            <FilterField className='sm:col-span-2 lg:col-span-2'>
              <div className='space-y-2'>
                <Label htmlFor='cr-q'>Search</Label>
                <Input
                  id='cr-q'
                  placeholder='Name, email, phone, notes…'
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                />
              </div>
            </FilterField>
            {statusFilter !== 'pending' ? (
              <FilterField>
                <div className='space-y-2'>
                  <Label>Status</Label>
                  <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Any' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All statuses</SelectItem>
                      <SelectItem value='pending'>pending</SelectItem>
                      <SelectItem value='contacted'>contacted</SelectItem>
                      <SelectItem value='quoted'>quoted</SelectItem>
                      <SelectItem value='confirmed'>confirmed</SelectItem>
                      <SelectItem value='declined'>declined</SelectItem>
                      <SelectItem value='cancelled'>cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FilterField>
            ) : null}
            <FilterField>
              <div className='space-y-2'>
                <Label>Read</Label>
                <Select
                  value={readFilter}
                  onValueChange={(v) => setReadFilter(v as typeof readFilter)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any</SelectItem>
                    <SelectItem value='unread'>Unread</SelectItem>
                    <SelectItem value='read'>Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FilterField>
            <FilterField>
              <div className='space-y-2'>
                <Label>Vehicle slug</Label>
                <Select value={vehicleClass} onValueChange={setVehicleClass}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any</SelectItem>
                    {slugOptions.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterField>
            <FilterField>
              <div className='space-y-2'>
                <Label htmlFor='cr-from'>Pickup from</Label>
                <Input
                  id='cr-from'
                  type='date'
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </FilterField>
            <FilterField>
              <div className='space-y-2'>
                <Label htmlFor='cr-to'>Pickup to</Label>
                <Input
                  id='cr-to'
                  type='date'
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </FilterField>
            <FilterField className='flex items-end'>
              <Button type='button' variant='outline' className='w-full sm:w-auto' onClick={clearFilters}>
                Clear
              </Button>
            </FilterField>
          </FilterToolbar>

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              disabled={
                bulkRead.isPending ||
                !pageRows.some((r) => !r.read)
              }
              onClick={() =>
                bulkRead.mutate({
                  ids: pageRows.filter((r) => !r.read).map((r) => r.id),
                  read: true,
                })
              }
            >
              Mark visible unread as read
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={bulkRead.isPending || !rows.some((r) => !r.read)}
              onClick={() =>
                bulkRead.mutate({
                  ids: rows.filter((r) => !r.read).map((r) => r.id),
                  read: true,
                })
              }
            >
              Mark all filtered unread as read
            </Button>
          </div>

          <div className='min-w-0'>
            {isPending ? (
              <p className='text-muted-foreground text-sm'>Loading…</p>
            ) : rows.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No matching requests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dates</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className='whitespace-nowrap text-xs'>
                        {r.pickupDate} → {r.returnDate}
                      </TableCell>
                      <TableCell className='max-w-[120px] truncate text-sm capitalize'>
                        {r.vehicleClass === 'fourbyfour'
                          ? '4×4 Safari'
                          : r.vehicleClass.replace(/-/g, ' ')}
                      </TableCell>
                      <TableCell className='max-w-[140px]'>
                        <div className='truncate text-sm font-medium'>{r.name}</div>
                        <div className='text-muted-foreground truncate text-xs'>
                          {r.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminStatusSelect
                          value={r.status}
                          options={CAR_RENTAL_STATUSES}
                          disabled={updateStatus.isPending}
                          onChange={(status) =>
                            updateStatus.mutate({ id: r.id, status })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.read ? 'secondary' : 'default'}>
                          {r.read ? 'Read' : 'New'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap text-xs'>
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <ResourceRowActions
                          itemLabel={r.name}
                          onView={() => setViewR(r)}
                          onEdit={() => setEditR({ ...r })}
                          onDelete={() => setDeleteR(r)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {rows.length > PAGE_SZ ? (
            <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm'>
              <span className='text-muted-foreground'>
                Page {safePage} of {pageCount} · {PAGE_SZ} per page
              </span>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className='me-1 size-4' /> Prev
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next <ChevronRight className='ms-1 size-4' />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewR}
        onOpenChange={(o) => !o && setViewR(null)}
        title='Car rental request'
        description={viewR ? `${viewR.name} · ${viewR.pickupDate} → ${viewR.returnDate}` : undefined}
        onEdit={viewR ? () => setEditR({ ...viewR }) : undefined}
      >
        {viewR ? (
            <div className='space-y-3 text-sm'>
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' size='sm' asChild>
                  <a href={mailHref(viewR)}>
                    <Mail className='me-1 inline size-4' />
                    Mail
                  </a>
                </Button>
                {whatsappHref(viewR.phone, '') ? (
                  <Button variant='outline' size='sm' asChild>
                    <a
                      href={whatsappHref(
                        viewR.phone,
                        `Hi ${viewR.name}, we're following up on your car hire request (${viewR.pickupDate} → ${viewR.returnDate}).`,
                      )}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      WhatsApp
                    </a>
                  </Button>
                ) : (
                  <span className='text-muted-foreground self-center text-xs'>
                    WhatsApp unavailable (needs phone digits)
                  </span>
                )}
              </div>
              <div className='grid gap-2 sm:grid-cols-2'>
                <p>
                  <span className='text-muted-foreground'>Pickup</span>
                  <br />
                  <span className='font-medium'>{viewR.pickupDate}</span>
                </p>
                <p>
                  <span className='text-muted-foreground'>Return</span>
                  <br />
                  <span className='font-medium'>{viewR.returnDate}</span>
                </p>
              </div>
              <p>
                <span className='text-muted-foreground'>Vehicle class</span>
                <br />
                <span className='capitalize'>{viewR.vehicleClass}</span>
              </p>
              <p>
                <span className='text-muted-foreground'>Driver option</span>
                <br />
                {viewR.driverOption.replace(/-/g, ' ')}
              </p>
              <p>
                <span className='text-muted-foreground'>From</span>
                <br />
                {viewR.name} ({viewR.email})
                <br />
                <span className='text-muted-foreground'>{viewR.phone}</span>
              </p>
              <p>
                <span className='text-muted-foreground'>Pickup / drop-off</span>
                <br />
                {viewR.pickupLocation}
                <br />
                {viewR.returnLocation ? (
                  <span className='text-muted-foreground'>
                    Return: {viewR.returnLocation}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>Return: same as pickup</span>
                )}
              </p>
              <p>
                <span className='text-muted-foreground'>Extras</span>
                <br />
                {extrasLabel(viewR.extras ?? {})}
              </p>
              <div className='rounded-md border p-3'>
                <p className='text-muted-foreground text-xs'>Customer message</p>
                <p className='mt-1 whitespace-pre-wrap'>
                  {viewR.message || '—'}
                </p>
              </div>
              {viewR.adminNotes ? (
                <div className='rounded-md border border-dashed p-3'>
                  <p className='text-muted-foreground text-xs'>Admin notes</p>
                  <p className='mt-1 whitespace-pre-wrap'>{viewR.adminNotes}</p>
                </div>
              ) : null}
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant={statusVariants[viewR.status] ?? 'secondary'}>
                  {viewR.status}
                </Badge>
                <span className='text-muted-foreground text-xs'>
                  {new Date(viewR.createdAt).toLocaleString()}
                </span>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => mark.mutate({ id: viewR.id, read: !viewR.read })}
              >
                Mark as {viewR.read ? 'unread' : 'read'}
              </Button>
            </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editR}
        onOpenChange={(o) => !o && setEditR(null)}
        title='Edit request'
        description='Change status and notes. Customer details stay as they sent them.'
        itemName={editR?.name}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editR ? (
          <>
              <div className='rounded-md border p-3 text-sm'>
                <p className='text-muted-foreground text-xs'>Customer</p>
                <p className='mt-1'>
                  {editR.name} &lt;{editR.email}&gt;
                </p>
                <p className='text-muted-foreground text-xs'>{editR.phone}</p>
                <p className='mt-2 text-xs'>
                  {editR.pickupDate} → {editR.returnDate} · {editR.vehicleClass}
                </p>
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={editR.status} onValueChange={(v) => setEditR({ ...editR, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>pending</SelectItem>
                    <SelectItem value='contacted'>contacted</SelectItem>
                    <SelectItem value='quoted'>quoted</SelectItem>
                    <SelectItem value='confirmed'>confirmed</SelectItem>
                    <SelectItem value='declined'>declined</SelectItem>
                    <SelectItem value='cancelled'>cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='cnotes'>Admin notes</Label>
                <Textarea
                  id='cnotes'
                  value={editR.adminNotes}
                  onChange={(e) => setEditR({ ...editR, adminNotes: e.target.value })}
                  rows={5}
                  placeholder='Internal follow-up, quote sent, vehicle assigned…'
                />
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='cread'
                  checked={editR.read}
                  onCheckedChange={(c) => setEditR({ ...editR, read: c === true })}
                />
                <Label htmlFor='cread' className='font-normal'>
                  Mark as read
                </Label>
              </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteR}
        onOpenChange={(o) => !o && setDeleteR(null)}
        title='Delete this request?'
        desc={<span>This deletes the request. You cannot undo it.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
