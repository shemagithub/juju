import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminHeaderToolbar } from '@/components/shared/admin-header-toolbar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useSiteSettingsQuery } from '@/features/tourism/hooks/use-tourism-queries'
import { NeedsAttention } from './components/needs-attention'
import { QuickActions } from './components/quick-actions'
import { RecentActivity } from './components/recent-activity'
import { TourismStats } from './components/tourism-stats'

export function Dashboard() {
  const { data: settings = {} } = useSiteSettingsQuery()
  const brandName = String(
    (settings as Record<string, unknown>).brandName ?? 'RwandaQuest',
  )
  const publicBase = String(
    (settings as Record<string, string>).publicSiteUrl ?? 'http://localhost:3000',
  ).replace(/\/$/, '')

  return (
    <>
      <Header fixed>
        <AdminHeaderToolbar />
      </Header>

      <Main fixed fluid className='min-w-0 flex flex-1 flex-col gap-5 overflow-y-auto sm:gap-6'>
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <p className='text-primary mb-1 text-xs font-semibold tracking-wide uppercase'>
              Staff desk
            </p>
            <h1 className='text-2xl font-bold tracking-tight text-balance sm:text-3xl'>
              What needs doing
            </h1>
            <p className='text-muted-foreground text-pretty text-sm sm:text-base'>
              Reply to customers first, then update {brandName} pages.
            </p>
          </div>
          <Button variant='outline' size='sm' asChild>
            <a href={publicBase} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-2 size-4' />
              Open website
            </a>
          </Button>
        </div>

        <TourismStats />
        <NeedsAttention />
        <QuickActions />

        <div className='min-w-0'>
          <h2 className='mb-3 text-base font-semibold'>Latest requests</h2>
          <div className='bg-card rounded-xl border p-4 shadow-sm'>
            <RecentActivity />
          </div>
        </div>
      </Main>
    </>
  )
}
