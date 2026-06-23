import { Link } from '@tanstack/react-router'
import { Car, Image, MapPinned, Newspaper, Package, Sparkles, Tags } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'

type SnapshotItem = {
  label: string
  value: number
  hint: string
  to: string
  icon: typeof Package
}

export function WebsiteSnapshot() {
  const { data, isPending, isError } = useBootstrapQuery()

  if (isPending) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <Skeleton className='h-5 w-40' />
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError || !data?.dashboardSummary) return null

  const s = data.dashboardSummary

  const items: SnapshotItem[] = [
    {
      label: 'Destinations',
      value: s.destinationsTotal,
      hint: 'Travel guide pages',
      to: '/destinations',
      icon: MapPinned,
    },
    {
      label: 'Tour packages',
      value: s.packagesTotal,
      hint: 'Catalog offerings',
      to: '/tour-packages',
      icon: Package,
    },
    {
      label: 'Fleet vehicles',
      value: s.activeFleet,
      hint: `${s.fleetTotal} total in fleet`,
      to: '/car-rental/vehicles',
      icon: Car,
    },
    {
      label: 'Blog posts',
      value: s.publishedPosts,
      hint: `${s.blogPostsTotal} drafts + published`,
      to: '/blog',
      icon: Newspaper,
    },
    {
      label: 'Hero slides',
      value: s.heroSlidesTotal,
      hint: 'Active homepage slides',
      to: '/website/hero',
      icon: Sparkles,
    },
    {
      label: 'Package categories',
      value: (data.packageCategories ?? []).length,
      hint: 'Groups for tour packages',
      to: '/tour-packages/categories',
      icon: Tags,
    },
    {
      label: 'Gallery items',
      value: s.galleryTotal,
      hint: 'Photos & media',
      to: '/gallery',
      icon: Image,
    },
    {
      label: 'Approved reviews',
      value: s.approvedReviews,
      hint: `${s.reviewsTotal} total in admin`,
      to: '/reviews',
      icon: Sparkles,
    },
  ]

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Website content</CardTitle>
        <CardDescription>
          Live counts from your database — what visitors see on the travel site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className='hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors'
            >
              <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
                <item.icon className='size-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-lg font-semibold tabular-nums'>{item.value}</p>
                <p className='text-sm font-medium'>{item.label}</p>
                <p className='text-muted-foreground truncate text-xs'>{item.hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
