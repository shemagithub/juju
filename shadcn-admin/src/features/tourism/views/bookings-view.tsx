import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Search } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { BOOKING_STATUSES } from '../lib/status-options'
import {
  formatServiceType,
  packageNameFromRow,
  paymentFromDetails,
  travelersLabel,
} from '../lib/booking-display'
import {
  useTourBookingRequestsQuery,
  useTourBookingRequestsSummaryQuery,
  useTourPackagesQuery,
} from '../hooks/use-tourism-queries'

type TourBookingRequest = {
  id: string
  reference: string
  name: string
  email: string
  phone: string
  serviceType: string
  travelDate: string | null
  returnDate: string | null
  adults: number
  children: number
  packageId?: string | null
  status: string
  read: boolean
  createdAt: string
  details: Record<string, unknown>
}

const statusOptions = BOOKING_STATUSES

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TourismBookingsPage({
  statusFilter,
}: {
  statusFilter?: 'pending' | 'confirmed' | 'cancelled'
}) {
  const qc = useQueryClient()
  const { data: summary } = useTourBookingRequestsSummaryQuery()
  const { data = [], isPending, refetch } = useTourBookingRequestsQuery(
    statusFilter ? { status: statusFilter } : {},
  )
  const { data: packages = [] } = useTourPackagesQuery()

  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState<TourBookingRequest | null>(null)
  const [editRow, setEditRow] = useState<TourBookingRequest | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const pkgById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of packages as { id: string; title: string }[]) {
      m.set(p.id, p.title)
    }
    return m
  }, [packages])

  const rows = useMemo(() => {
    const titleFor = (id: string) => pkgById.get(id) ?? id
    const list = (data as TourBookingRequest[]).filter((r) =>
      statusFilter ? r.status === statusFilter : true,
    )
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => {
      const pkg = packageNameFromRow(r.packageId, r.details, titleFor).toLowerCase()
      return (
        r.reference.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q) ||
        r.serviceType.toLowerCase().includes(q) ||
        pkg.includes(q)
      )
    })
  }, [data, statusFilter, search, pkgById])

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/tour-booking-requests/${id}`, { read: true })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests'] })
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/tour-booking-requests/${id}`, { status, read: true })
    },
    onSuccess: async () => {
      toast.success('Booking updated — guest notified by email')
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests'] })
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      setEditRow(null)
    },
    onError: handleServerError,
  })

  const openView = (row: TourBookingRequest) => {
    setViewRow(row)
    if (!row.read) markRead.mutate(row.id)
  }

  const openEdit = (row: TourBookingRequest) => {
    setEditRow({ ...row })
    if (!row.read) markRead.mutate(row.id)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editRow) return
    setEditSaving(true)
    try {
      await api.patch(`/api/tour-booking-requests/${editRow.id}`, {
        status: editRow.status,
        read: true,
      })
      toast.success('Booking saved')
      setEditRow(null)
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests'] })
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const title =
    statusFilter === 'pending'
      ? 'Pending bookings'
      : statusFilter === 'confirmed'
        ? 'Confirmed bookings'
        : statusFilter === 'cancelled'
          ? 'Cancelled bookings'
          : 'All bookings'

  return (
    <TourismAdminShell
      title={title}
      description='People who booked from the website. Search a name, then confirm or reply.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <div className='mb-4 flex flex-wrap gap-2'>
        {(
          [
            { label: 'All', to: '/bookings', active: !statusFilter },
            { label: 'Pending', to: '/bookings/pending', active: statusFilter === 'pending' },
            { label: 'Confirmed', to: '/bookings/confirmed', active: statusFilter === 'confirmed' },
            { label: 'Cancelled', to: '/bookings/cancelled', active: statusFilter === 'cancelled' },
          ] as const
        ).map((tab) => (
          <Button key={tab.to} size='sm' variant={tab.active ? 'default' : 'outline'} asChild>
            <Link to={tab.to}>{tab.label}</Link>
          </Button>
        ))}
      </div>
      <div className='mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total bookings</CardDescription>
            <CardTitle>{summary?.total ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Unread</CardDescription>
            <CardTitle>{summary?.unread ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Pending</CardDescription>
            <CardTitle>{summary?.byStatus?.pending ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Confirmed</CardDescription>
            <CardTitle>{summary?.byStatus?.confirmed ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who booked</CardTitle>
          <CardDescription>
            Search a guest, then open the row to confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0 space-y-4'>
          <div className='relative max-w-md'>
            <Search className='text-muted-foreground absolute top-2.5 left-2.5 size-4' />
            <Input
              className='pl-9'
              placeholder='Search guest, email, reference…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Package / service</TableHead>
                  <TableHead>Travel date</TableHead>
                  <TableHead>Travelers</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className='font-mono text-xs'>{row.reference}</div>
                      <div className='text-muted-foreground text-[10px]'>
                        {formatWhen(row.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{row.name}</div>
                      <div className='text-muted-foreground text-xs'>{row.email}</div>
                      {row.phone ? (
                        <div className='text-muted-foreground text-xs'>{row.phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className='max-w-[180px]'>
                      <div className='truncate text-sm font-medium'>
                        {packageNameFromRow(row.packageId, row.details, (id) => pkgById.get(id) ?? id)}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {formatServiceType(row.serviceType)}
                      </div>
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-sm'>
                      {row.travelDate ?? '—'}
                      {row.returnDate ? (
                        <span className='text-muted-foreground block text-xs'>
                          → {row.returnDate}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {travelersLabel(row.adults, row.children)}
                    </TableCell>
                    <TableCell className='max-w-[120px] truncate text-xs'>
                      {paymentFromDetails(row.details)}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap items-center gap-2'>
                        <AdminStatusSelect
                          value={row.status}
                          options={statusOptions}
                          disabled={updateStatus.isPending}
                          onChange={(status) =>
                            updateStatus.mutate({ id: row.id, status })
                          }
                        />
                        {!row.read ? <Badge variant='outline'>new</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={row.reference}
                        onView={() => openView(row)}
                        onEdit={() => openEdit(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-muted-foreground text-center'>
                      No bookings yet. Submissions from the travel website will appear here.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title={viewRow?.reference ?? 'Booking'}
        description={viewRow ? `${viewRow.name} · ${formatServiceType(viewRow.serviceType)}` : undefined}
        size='2xl'
        onEdit={viewRow ? () => openEdit(viewRow) : undefined}
      >
        {viewRow ? (
          <div className='grid gap-4 text-sm sm:grid-cols-2'>
            <div className='space-y-2'>
              <p>
                <span className='text-muted-foreground'>Guest:</span> {viewRow.name}
              </p>
              <p>
                <span className='text-muted-foreground'>Email:</span>{' '}
                <a className='text-primary underline' href={`mailto:${viewRow.email}`}>
                  {viewRow.email}
                </a>
              </p>
              <p>
                <span className='text-muted-foreground'>Phone:</span>{' '}
                {viewRow.phone || '—'}
              </p>
              <p>
                <span className='text-muted-foreground'>Submitted:</span>{' '}
                {formatWhen(viewRow.createdAt)}
              </p>
            </div>
            <div className='space-y-2'>
              <p>
                <span className='text-muted-foreground'>Package:</span>{' '}
                {packageNameFromRow(viewRow.packageId, viewRow.details, (id) => pkgById.get(id) ?? id)}
              </p>
              <p>
                <span className='text-muted-foreground'>Service:</span>{' '}
                {formatServiceType(viewRow.serviceType)}
              </p>
              <p>
                <span className='text-muted-foreground'>Travel:</span>{' '}
                {viewRow.travelDate ?? '—'}
                {viewRow.returnDate ? ` → ${viewRow.returnDate}` : ''}
              </p>
              <p>
                <span className='text-muted-foreground'>Travelers:</span>{' '}
                {travelersLabel(viewRow.adults, viewRow.children)}
              </p>
              <p>
                <span className='text-muted-foreground'>Payment:</span>{' '}
                {paymentFromDetails(viewRow.details)}
              </p>
              <p>
                <span className='text-muted-foreground'>Status:</span> {viewRow.status}
              </p>
            </div>
            {Object.keys(viewRow.details || {}).length > 0 ? (
              <div className='sm:col-span-2'>
                <p className='text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide'>
                  Booking details
                </p>
                <dl className='bg-muted/50 grid gap-2 rounded-md border p-3 text-xs sm:grid-cols-2'>
                  {Object.entries(viewRow.details)
                    .filter(([k]) => !['paymentMethod', 'paymentLabel', 'packageName', 'packageId'].includes(k))
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt className='text-muted-foreground capitalize'>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className='font-medium break-words'>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title='Update booking status'
        itemName={editRow?.reference}
        onSubmit={saveEdit}
        saving={editSaving}
        saveLabel='Save status'
      >
        {editRow ? (
          <>
            <p className='text-muted-foreground text-sm'>
              Guest: <strong>{editRow.name}</strong> ({editRow.email})
            </p>
            <div className='space-y-2'>
              <Label htmlFor='b-status'>Status</Label>
              <AdminStatusSelect
                value={editRow.status}
                options={statusOptions}
                onChange={(status) => setEditRow({ ...editRow, status })}
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={() => updateStatus.mutate({ id: editRow.id, status: 'confirmed' })}
              >
                Confirm booking
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => updateStatus.mutate({ id: editRow.id, status: 'cancelled' })}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : null}
      </ResourceEditDialog>
    </TourismAdminShell>
  )
}
