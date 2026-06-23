import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'

function formatRwf(n: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(n)
}

type StatCardProps = {
  title: string
  value: string
  hint: string
  to: string
}

function StatCard({ title, value, hint, to }: StatCardProps) {
  return (
    <Link to={to} className='block'>
      <Card className='hover:bg-muted/40 h-full transition-colors'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{value}</div>
          <p className='text-muted-foreground text-xs'>{hint}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function TourismStats() {
  const { data, isPending, isError } = useBootstrapQuery()

  if (isPending) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-32' />
              <Skeleton className='h-3 w-40' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
        Could not load live stats. Start the API on port 4000 and refresh.
      </div>
    )
  }

  const s = data.dashboardSummary
  const revenue = s?.revenueRwf ?? data.monthlyMetrics.reduce((sum, m) => sum + m.revenueRwf, 0)
  const bookings = s?.bookingsTotal ?? data.tourBookingRequests?.length ?? data.bookings.length
  const tourPending = s?.pendingTourRequests ?? 0
  const pendingBookings =
    (s?.bookingsByStatus?.pending ?? 0) || tourPending
  const unreadMessages = s?.unreadMessages ?? (data.messages ?? []).filter(
    (m) => typeof m === 'object' && m !== null && 'read' in m && !(m as { read: boolean }).read,
  ).length
  const destinations = s?.destinationsTotal ?? data.destinations.length
  const pendingReviews = s?.pendingReviews ?? (data.reviews ?? []).filter(
    (r) =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      (r as { status: string }).status === 'pending',
  ).length

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      <StatCard
        title='Revenue (Rwf)'
        value={formatRwf(revenue)}
        hint={
          s?.paymentsRevenue
            ? 'From completed payments'
            : s?.bookingsRevenue
              ? 'From booking totals'
              : 'Tap for revenue reports'
        }
        to='/reports/revenue'
      />
      <StatCard
        title='Bookings'
        value={String(bookings)}
        hint={`${pendingBookings} pending · ${s?.unreadTourRequests ?? 0} unread`}
        to='/bookings'
      />
      <StatCard
        title='Messages'
        value={String(unreadMessages)}
        hint={`${s?.messagesTotal ?? data.messages.length} total inquiries`}
        to='/messages/contact'
      />
      <StatCard
        title='Destinations'
        value={String(destinations)}
        hint={`${s?.packagesTotal ?? data.packages.length} packages linked`}
        to='/destinations'
      />
      <StatCard
        title='Reviews'
        value={String(pendingReviews)}
        hint={`${s?.approvedReviews ?? 0} approved on site`}
        to='/reviews/pending'
      />
    </div>
  )
}
