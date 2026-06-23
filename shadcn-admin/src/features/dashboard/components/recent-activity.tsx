import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'

type ActivityKind = 'booking' | 'tour-request' | 'message' | 'car-rental'

type ActivityRow = {
  id: string
  kind: ActivityKind
  title: string
  subtitle: string
  status: string
  createdAt: string
  to: string
  detail: Record<string, string>
}

const kindLabels: Record<ActivityKind, string> = {
  booking: 'Booking',
  'tour-request': 'Tour request',
  message: 'Message',
  'car-rental': 'Car rental',
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecentActivity() {
  const { data, isPending } = useBootstrapQuery()
  const [viewRow, setViewRow] = useState<ActivityRow | null>(null)

  const pkgsById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of (data?.packages ?? []) as { id?: string; title?: string }[]) {
      if (!p?.id) continue
      m.set(String(p.id), String(p.title ?? 'Tour package'))
    }
    return m
  }, [data?.packages])

  const rows = useMemo(() => {
    if (!data) return [] as ActivityRow[]
    const out: ActivityRow[] = []

    for (const r of (data.tourBookingRequests ?? []) as {
      id: string
      reference: string
      name: string
      email: string
      serviceType: string
      status: string
      createdAt: string
    }[]) {
      out.push({
        id: r.id,
        kind: 'booking',
        title: r.name,
        subtitle: `${pkgsById.get(String((r as { packageId?: string }).packageId ?? '')) ?? r.serviceType} · ${r.reference}`,
        status: r.status,
        createdAt: r.createdAt,
        to: '/bookings',
        detail: {
          Reference: r.reference,
          Email: r.email,
          Service: r.serviceType,
          Status: r.status,
        },
      })
    }

    for (const m of (data.messages ?? []) as {
      id: string
      name: string
      email: string
      subject: string
      source: string
      read: boolean
      createdAt: string
    }[]) {
      out.push({
        id: m.id,
        kind: 'message',
        title: m.name,
        subtitle: m.subject || m.source,
        status: m.read ? 'read' : 'unread',
        createdAt: m.createdAt,
        to: '/messages/contact',
        detail: {
          From: m.name,
          Email: m.email,
          Subject: m.subject || '—',
          Source: m.source,
        },
      })
    }

    for (const c of (data.carRentalRequests ?? []) as {
      id: string
      name: string
      vehicleClass: string
      status: string
      pickupDate: string
      createdAt: string
    }[]) {
      out.push({
        id: c.id,
        kind: 'car-rental',
        title: c.name,
        subtitle: `${c.vehicleClass} · ${String(c.pickupDate).slice(0, 10)}`,
        status: c.status,
        createdAt: c.createdAt,
        to: '/car-rental',
        detail: {
          Vehicle: c.vehicleClass,
          Pickup: String(c.pickupDate).slice(0, 10),
          Status: c.status,
        },
      })
    }

    return out
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
  }, [data, pkgsById])

  if (isPending) {
    return <p className='text-muted-foreground text-sm'>Loading activity…</p>
  }

  if (rows.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        No recent activity yet — bookings, tour requests, messages, and car rental
        quotes will appear here.
      </p>
    )
  }

  return (
    <>
      <div className='space-y-4'>
        {rows.map((row) => (
          <div
            key={`${row.kind}-${row.id}`}
            className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'
          >
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='text-[10px] uppercase'>
                  {kindLabels[row.kind]}
                </Badge>
                <Badge variant={row.status === 'pending' || row.status === 'unread' ? 'secondary' : 'default'}>
                  {row.status}
                </Badge>
              </div>
              <p className='mt-1 truncate text-sm font-medium'>{row.title}</p>
              <p className='text-muted-foreground truncate text-xs'>{row.subtitle}</p>
              <p className='text-muted-foreground text-xs'>{formatWhen(row.createdAt)}</p>
            </div>
            <div className='flex w-full shrink-0 gap-1 sm:w-auto'>
              <Button size='sm' variant='ghost' onClick={() => setViewRow(row)}>
                View
              </Button>
              <Button size='sm' variant='outline' asChild>
                <Link to={row.to}>Open</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{viewRow ? kindLabels[viewRow.kind] : 'Activity'}</DialogTitle>
            <DialogDescription>{viewRow?.title}</DialogDescription>
          </DialogHeader>
          {viewRow ? (
            <div className='space-y-2 text-sm'>
              {Object.entries(viewRow.detail).map(([k, v]) => (
                <p key={k}>
                  <span className='text-muted-foreground'>{k}:</span> {v}
                </p>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
