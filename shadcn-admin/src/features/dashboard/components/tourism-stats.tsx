import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'

type StatCardProps = {
  title: string
  value: string
  hint: string
  to: string
  urgent?: boolean
}

function StatCard({ title, value, hint, to, urgent }: StatCardProps) {
  return (
    <Link
      to={to}
      className='bg-card hover:border-primary/40 block rounded-xl border p-4 shadow-sm transition-colors'
    >
      <p className='text-muted-foreground text-sm font-medium'>{title}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${urgent && Number(value) > 0 ? 'text-primary' : ''}`}>
        {value}
      </p>
      <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
    </Link>
  )
}

export function TourismStats() {
  const { data, isPending, isError } = useBootstrapQuery()

  if (isPending) {
    return (
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-28 rounded-xl' />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='text-muted-foreground rounded-xl border border-dashed p-4 text-sm'>
        Could not load numbers. Check the connection and refresh.
      </div>
    )
  }

  const s = data.dashboardSummary
  const tourPending = s?.pendingTourRequests ?? 0
  const pendingBookings = (s?.bookingsByStatus?.pending ?? 0) || tourPending
  const unreadMessages =
    s?.unreadMessages ??
    (data.messages ?? []).filter(
      (m) => typeof m === 'object' && m !== null && 'read' in m && !(m as { read: boolean }).read,
    ).length
  const pendingCarRental = (data.carRentalRequests ?? []).filter(
    (r) =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      (r as { status: string }).status === 'pending',
  ).length
  const pendingReviews =
    s?.pendingReviews ??
    (data.reviews ?? []).filter(
      (r) =>
        typeof r === 'object' &&
        r !== null &&
        'status' in r &&
        (r as { status: string }).status === 'pending',
    ).length

  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        title='Bookings waiting'
        value={String(pendingBookings)}
        hint='Tap to confirm or reply'
        to='/bookings/pending'
        urgent
      />
      <StatCard
        title='New messages'
        value={String(unreadMessages)}
        hint='Contact form inbox'
        to='/messages/contact'
        urgent
      />
      <StatCard
        title='Car quotes'
        value={String(pendingCarRental)}
        hint='Rental requests to price'
        to='/car-rental/pending'
        urgent
      />
      <StatCard
        title='Reviews to check'
        value={String(pendingReviews)}
        hint='Approve to show on the site'
        to='/reviews/pending'
      />
    </div>
  )
}
