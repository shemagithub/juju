import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import {
  formatServiceType,
  packageNameFromRow,
  paymentFromDetails,
} from '@/features/tourism/lib/booking-display'
import { BOOKING_STATUSES } from '@/features/tourism/lib/status-options'

type TourRequestRow = {
  id: string
  reference: string
  name: string
  email: string
  phone: string
  serviceType: string
  travelDate: string | null
  packageId?: string | null
  status: string
  createdAt: string
  details: Record<string, unknown>
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function RecentSales() {
  const qc = useQueryClient()
  const { data } = useBootstrapQuery()
  const [viewRow, setViewRow] = useState<TourRequestRow | null>(null)
  const [updating, setUpdating] = useState(false)

  const pkgsById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of (data?.packages ?? []) as { id?: string; title?: string }[]) {
      if (!p?.id) continue
      m.set(String(p.id), String(p.title ?? ''))
    }
    return m
  }, [data?.packages])

  const recent = useMemo(() => {
    const list = ((data?.tourBookingRequests ?? []) as TourRequestRow[]).slice()
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    return list.slice(0, 6)
  }, [data?.tourBookingRequests])

  const pkgLabel = (row: TourRequestRow) =>
    packageNameFromRow(row.packageId, row.details, (id) => pkgsById.get(id) ?? id)

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      await api.patch(`/api/tour-booking-requests/${id}`, { status, read: true })
      toast.success('Booking updated')
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      await qc.invalidateQueries({ queryKey: ['tour-booking-requests'] })
      setViewRow(null)
    } catch (err) {
      handleServerError(err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <div className='space-y-6'>
        {recent.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            No bookings yet. Customer submissions from the website appear here.
          </p>
        ) : (
          recent.map((row) => {
            const pkg = pkgLabel(row)
            return (
              <div key={row.id} className='flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold'>
                    {initials(row.name)}
                  </div>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{row.name}</p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {pkg !== '—' ? pkg : formatServiceType(row.serviceType)} ·{' '}
                      {row.travelDate?.slice(0, 10) ?? row.reference}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant={row.status === 'confirmed' ? 'default' : 'secondary'} className='text-xs'>
                    {row.status}
                  </Badge>
                  <ResourceRowActions onView={() => setViewRow(row)} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {recent.length > 0 ? (
        <Button variant='link' className='mt-4 h-auto px-0' asChild>
          <Link to='/bookings'>View all bookings</Link>
        </Button>
      ) : null}

      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{viewRow?.reference ?? 'Booking'}</DialogTitle>
            <DialogDescription>{viewRow?.name}</DialogDescription>
          </DialogHeader>
          {viewRow ? (
            <div className='space-y-3 text-sm'>
              <p>
                <span className='text-muted-foreground'>Email:</span> {viewRow.email}
              </p>
              <p>
                <span className='text-muted-foreground'>Phone:</span> {viewRow.phone || '—'}
              </p>
              <p>
                <span className='text-muted-foreground'>Package:</span> {pkgLabel(viewRow)}
              </p>
              <p>
                <span className='text-muted-foreground'>Service:</span>{' '}
                {formatServiceType(viewRow.serviceType)}
              </p>
              <p>
                <span className='text-muted-foreground'>Travel date:</span>{' '}
                {viewRow.travelDate ?? '—'}
              </p>
              <p>
                <span className='text-muted-foreground'>Payment:</span>{' '}
                {paymentFromDetails(viewRow.details)}
              </p>
              <div className='space-y-2'>
                <span className='text-muted-foreground text-xs'>Status</span>
                <AdminStatusSelect
                  value={viewRow.status}
                  options={BOOKING_STATUSES}
                  disabled={updating}
                  onChange={(status) => void updateStatus(viewRow.id, status)}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
