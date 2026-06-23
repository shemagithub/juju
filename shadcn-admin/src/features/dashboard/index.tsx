import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdminHeaderToolbar } from '@/components/shared/admin-header-toolbar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useSiteSettingsQuery } from '@/features/tourism/hooks/use-tourism-queries'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'
import { NeedsAttention } from './components/needs-attention'
import { Overview } from './components/overview'
import { QuickActions } from './components/quick-actions'
import { RecentActivity } from './components/recent-activity'
import { TourismStats } from './components/tourism-stats'
import { WebsiteSnapshot } from './components/website-snapshot'

export function Dashboard() {
  const { data: bootstrap } = useBootstrapQuery()
  const { data: settings = {} } = useSiteSettingsQuery()
  const brandName = String(
    (settings as Record<string, unknown>).brandName ?? 'RwandaQuest',
  )
  const publicBase = String(
    (settings as Record<string, string>).publicSiteUrl ?? 'http://localhost:3000',
  ).replace(/\/$/, '')

  const revenueChart = bootstrap?.monthlyMetrics
    ?.filter((m) => m.revenueRwf > 0)
    .map((m) => ({
      name: m.month,
      total: m.revenueRwf,
    }))

  const bookingsChart = bootstrap?.monthlyMetrics
    ?.filter((m) => m.bookings > 0)
    .map((m) => ({
      name: m.month,
      total: m.bookings,
    }))

  return (
    <>
      <Header fixed>
        <AdminHeaderToolbar />
      </Header>

      <Main fixed fluid className='min-w-0 flex flex-1 flex-col gap-4 overflow-y-auto sm:gap-6'>
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <h1 className='text-xl font-bold tracking-tight text-balance sm:text-2xl'>
              Dashboard
            </h1>
            <p className='text-muted-foreground text-pretty text-sm sm:text-base'>
              {brandName} — bookings, website content, and live site status at a
              glance.
            </p>
          </div>
          <Button variant='outline' size='sm' asChild>
            <a href={publicBase} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-2 size-4' />
              Open travel website
            </a>
          </Button>
        </div>

        <TourismStats />

        <WebsiteSnapshot />

        <div className='grid gap-4 lg:grid-cols-2'>
          <NeedsAttention />
          <QuickActions />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='col-span-1 lg:col-span-4'>
            <CardHeader>
              <CardTitle>Revenue overview</CardTitle>
              <CardDescription>
                Monthly totals from bookings and payments in your database.
              </CardDescription>
            </CardHeader>
            <CardContent className='ps-2'>
              <Overview chartData={revenueChart} bookingsData={bookingsChart} />
            </CardContent>
          </Card>
          <Card className='col-span-1 lg:col-span-3'>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                Latest bookings, tour requests, messages, and car rental quotes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
