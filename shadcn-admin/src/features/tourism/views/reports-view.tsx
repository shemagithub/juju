import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useDestinationsQuery, useTourPackagesQuery } from '../hooks/use-tourism-queries'

export function TourismReportsPage({
  variant,
}: {
  variant: 'revenue' | 'analytics' | 'bookings'
}) {
  const { data: boot, refetch, isPending } = useBootstrapQuery()
  const { data: dest = [] } = useDestinationsQuery()
  const { data: pkgs = [] } = useTourPackagesQuery()

  const metrics =
    boot?.monthlyMetrics?.map((m) => ({
      month: m.month,
      revenue: m.revenueRwf,
      bookings: m.bookings,
    })) ?? []

  const title =
    variant === 'revenue'
      ? 'Revenue reports'
      : variant === 'analytics'
        ? 'User analytics'
        : 'Booking reports'

  return (
    <TourismAdminShell
      title={title}
      description='Numbers from bookings and the website.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue (Rwf)</CardTitle>
            <CardDescription>From `monthly_metrics` table</CardDescription>
          </CardHeader>
          <CardContent className='h-[300px]'>
            {isPending ? (
              <p className='text-muted-foreground text-sm'>Loading…</p>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={metrics}>
                  <XAxis dataKey='month' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='revenue' fill='hsl(var(--primary))' name='Rwf' />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly bookings</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px]'>
            {isPending ? null : (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={metrics}>
                  <XAxis dataKey='month' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='bookings' fill='hsl(var(--chart-2))' />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className='mt-4'>
        <CardHeader>
          <CardTitle>Popular inventory</CardTitle>
          <CardDescription>
            Destinations: {dest.length} · Packages: {pkgs.length}
          </CardDescription>
        </CardHeader>
      </Card>
    </TourismAdminShell>
  )
}
