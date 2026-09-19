import { Link } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  CalendarDays,
  Car,
  MessageSquare,
  Star,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'

type AttentionItem = {
  label: string
  count: number
  hint: string
  to: string
  icon: ElementType
}

export function NeedsAttention() {
  const { data, isPending } = useBootstrapQuery()

  if (isPending) {
    return (
      <section className='bg-card rounded-xl border p-4 shadow-sm sm:p-5'>
        <h2 className='text-base font-semibold'>Needs a reply</h2>
        <p className='text-muted-foreground mt-2 text-sm'>Loading inbox…</p>
      </section>
    )
  }

  if (!data) return null

  const pendingBookings =
    data.dashboardSummary?.bookingsByStatus?.pending ??
    (data.tourBookingRequests ?? []).filter(
      (r) =>
        typeof r === 'object' &&
        r !== null &&
        'status' in r &&
        (r as { status: string }).status === 'pending',
    ).length
  const unreadMessages = (data.messages ?? []).filter(
    (m) =>
      typeof m === 'object' &&
      m !== null &&
      'read' in m &&
      !(m as { read: boolean }).read,
  ).length
  const pendingReviews = (data.reviews ?? []).filter(
    (r) =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      (r as { status: string }).status === 'pending',
  ).length
  const pendingCarRental = (data.carRentalRequests ?? []).filter(
    (r) =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      (r as { status: string }).status === 'pending',
  ).length
  const pendingTourRequests =
    data.dashboardSummary?.pendingTourRequests ??
    (data.tourBookingRequests ?? []).filter(
      (r) =>
        typeof r === 'object' &&
        r !== null &&
        'status' in r &&
        (r as { status: string }).status === 'pending',
    ).length

  const items: AttentionItem[] = [
    {
      label: 'Pending bookings',
      count: Math.max(pendingBookings, pendingTourRequests),
      hint: 'Confirm or reply',
      to: '/bookings/pending',
      icon: CalendarDays,
    },
    {
      label: 'Unread messages',
      count: unreadMessages,
      hint: 'Contact form',
      to: '/messages/contact',
      icon: MessageSquare,
    },
    {
      label: 'Car rental quotes',
      count: pendingCarRental,
      hint: 'Price and reply',
      to: '/car-rental/pending',
      icon: Car,
    },
    {
      label: 'Reviews to approve',
      count: pendingReviews,
      hint: 'Show on the website',
      to: '/reviews/pending',
      icon: Star,
    },
  ]

  const waiting = items.filter((item) => item.count > 0)

  return (
    <section className='bg-card rounded-xl border p-4 shadow-sm sm:p-5'>
      <div className='mb-3'>
        <h2 className='text-base font-semibold'>Needs a reply</h2>
        <p className='text-muted-foreground text-sm'>
          Open these first — customers are waiting.
        </p>
      </div>
      {waiting.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Inbox is clear. Use the shortcuts below to update the website.
        </p>
      ) : (
        <ul className='grid gap-3 sm:grid-cols-2'>
          {waiting.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className='hover:border-primary/40 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
                    <item.icon className='size-4' />
                  </div>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-medium'>{item.label}</span>
                      <Badge>{item.count}</Badge>
                    </div>
                    <p className='text-muted-foreground text-xs'>{item.hint}</p>
                  </div>
                </div>
                <span className='text-primary text-sm font-semibold'>Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
