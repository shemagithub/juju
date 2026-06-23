import { Link } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  CalendarDays,
  Car,
  MessageSquare,
  Star,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Needs your attention</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>Loading inbox…</p>
        </CardContent>
      </Card>
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
      hint: 'Website bookings awaiting confirmation',
      to: '/bookings/pending',
      icon: CalendarDays,
    },
    {
      label: 'Unread messages',
      count: unreadMessages,
      hint: 'Contact form & inquiries',
      to: '/messages/contact',
      icon: MessageSquare,
    },
    {
      label: 'Car rental quotes',
      count: pendingCarRental,
      hint: 'New quote requests',
      to: '/car-rental/pending',
      icon: Car,
    },
    {
      label: 'Reviews to approve',
      count: pendingReviews,
      hint: 'Publish testimonials on the site',
      to: '/reviews/pending',
      icon: Star,
    },
  ].filter((item) => item.count > 0)

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Needs your attention</CardTitle>
        <CardDescription>
          Open items that usually need a response first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            All caught up — no pending bookings, messages, quotes, or reviews.
          </p>
        ) : (
          <ul className='space-y-3'>
            {items.map((item) => (
              <li
                key={item.to}
                className='flex items-center justify-between gap-3 rounded-lg border p-3'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
                    <item.icon className='text-muted-foreground size-4' />
                  </div>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-medium'>{item.label}</span>
                      <Badge variant='secondary'>{item.count}</Badge>
                    </div>
                    <p className='text-muted-foreground text-xs'>{item.hint}</p>
                  </div>
                </div>
                <Button size='sm' variant='outline' asChild>
                  <Link to={item.to}>Open</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
