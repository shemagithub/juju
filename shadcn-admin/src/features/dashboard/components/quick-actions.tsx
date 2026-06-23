import { Link } from '@tanstack/react-router'
import {
  ExternalLink,
  Package,
  PenLine,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSiteSettingsQuery } from '@/features/tourism/hooks/use-tourism-queries'

const ACTIONS = [
  {
    title: 'Package categories',
    description: 'Group tour packages for browsing on the website',
    to: '/tour-packages/categories',
    icon: Package,
  },
  {
    title: 'Contact & brand',
    description: 'Logo, company name, phone, and address',
    to: '/settings/contact',
    icon: Settings,
  },
  {
    title: 'Add tour package',
    description: 'Publish a new safari or trek offering',
    to: '/tour-packages/new',
    icon: Package,
  },
  {
    title: 'Home hero slide',
    description: 'Update the main homepage carousel',
    to: '/website/hero/new',
    icon: Sparkles,
  },
  {
    title: 'About page copy',
    description: 'Story, mission, stats, and call to action',
    to: '/settings/about',
    icon: PenLine,
  },
] as const

export function QuickActions() {
  const { data: settings = {} } = useSiteSettingsQuery()
  const publicBase = String(
    (settings as Record<string, string>).publicSiteUrl ?? 'http://localhost:3000',
  ).replace(/\/$/, '')

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <CardTitle className='text-base'>Quick actions</CardTitle>
            <CardDescription>
              Common tasks to keep the travel website up to date.
            </CardDescription>
          </div>
          <Button variant='outline' size='sm' asChild>
            <a href={publicBase} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-1 size-4' />
              View live site
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid gap-3 sm:grid-cols-2'>
          {ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className='hover:bg-muted/50 flex gap-3 rounded-lg border p-3 transition-colors'
            >
              <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
                <action.icon className='size-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{action.title}</p>
                <p className='text-muted-foreground text-xs'>
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
