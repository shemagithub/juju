import { ExternalLink } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useSiteSettingsQuery } from '../hooks/use-tourism-queries'

type PageEntry = {
  label: string
  publicPath: string
  adminPath: string
  adminLabel: string
  summary: string
}

const PAGE_GROUPS: { title: string; description: string; pages: PageEntry[] }[] = [
  {
    title: 'Main pages',
    description: 'Core travel website routes visitors use most.',
    pages: [
      {

        label: 'Home',
        publicPath: '/',
        adminPath: '/website/hero',
        adminLabel: 'Hero slides',
        summary: 'Homepage carousel and headline content',
      },
      {
        label: 'Packages',
        publicPath: '/packages',
        adminPath: '/tour-packages',
        adminLabel: 'Tour packages',
        summary: 'Safari and trek offerings by category',
      },
      {
        label: 'Package categories',
        publicPath: '/packages',
        adminPath: '/tour-packages/categories',
        adminLabel: 'Package categories',
        summary: 'Group packages for browsing and filtering',
      },
      {
        label: 'Destinations',
        publicPath: '/destinations',
        adminPath: '/destinations',
        adminLabel: 'Destinations',
        summary: 'Travel guide and destination write-ups',
      },
      {
        label: 'Car rental',
        publicPath: '/car-rental',
        adminPath: '/car-rental/vehicles',
        adminLabel: 'Fleet vehicles',
        summary: 'Vehicles shown on the rental page',
      },
      {
        label: 'Book',
        publicPath: '/book',
        adminPath: '/bookings/tour-requests',
        adminLabel: 'Tour requests',
        summary: 'Custom trip inquiries from the book page',
      },
    ],
  },
  {
    title: 'Company',
    description: 'Brand story, team, and ways to reach you.',
    pages: [
      {
        label: 'About us',
        publicPath: '/about',
        adminPath: '/settings/about',
        adminLabel: 'About page',
        summary: 'Story, mission, stats, and CTA copy',
      },
      {
        label: 'Team section',
        publicPath: '/about#team',
        adminPath: '/settings/team',
        adminLabel: 'Team members',
        summary: 'Staff cards on the About page',
      },
      {
        label: 'Contact',
        publicPath: '/contact',
        adminPath: '/settings/contact',
        adminLabel: 'Contact & brand',
        summary: 'Logo, phone, email, hours, and address',
      },
    ],
  },
  {
    title: 'Content & media',
    description: 'Blog posts, gallery, and social proof.',
    pages: [
      {
        label: 'Blog',
        publicPath: '/blog',
        adminPath: '/blog',
        adminLabel: 'Blog posts',
        summary: 'Articles and travel tips',
      },
      {
        label: 'Gallery',
        publicPath: '/gallery',
        adminPath: '/gallery',
        adminLabel: 'Gallery media',
        summary: 'Photos shown on the gallery page',
      },
      {
        label: 'Reviews',
        publicPath: '/',
        adminPath: '/reviews',
        adminLabel: 'Customer reviews',
        summary: 'Testimonials — approve before they appear on Home',
      },
    ],
  },
  {
    title: 'Legal',
    description: 'Policy pages linked in the site footer.',
    pages: [
      {
        label: 'Privacy policy',
        publicPath: '/privacy',
        adminPath: '/settings/legal',
        adminLabel: 'Legal pages',
        summary: 'Privacy policy body text',
      },
      {
        label: 'Terms & conditions',
        publicPath: '/terms',
        adminPath: '/settings/legal',
        adminLabel: 'Legal pages',
        summary: 'Terms and conditions body text',
      },
    ],
  },
]

export function TourismWebsitePagesView() {
  const { data: settings = {} } = useSiteSettingsQuery()
  const base = String(
    (settings as Record<string, string>).publicSiteUrl || 'http://localhost:3000',
  ).replace(/\/$/, '')
  const brandName = String(
    (settings as Record<string, string>).brandName || 'RwandaQuest',
  )

  return (
    <TourismAdminShell
      title='Page manager'
      description={`Map of every ${brandName} travel-app page — edit content in admin, then preview on the live site.`}
    >
      <Card className='mb-6 border-primary/20 bg-primary/5'>
        <CardHeader>
          <CardTitle>Live website</CardTitle>
          <CardDescription>
            Saved changes sync to the public site when visitors load data from the
            API. Use Preview on any card to check a page.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button asChild>
            <a href={base} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-2 size-4' />
              Open {base}
            </a>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/settings/contact'>Contact & brand</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/settings/content'>Website content</Link>
          </Button>
        </CardContent>
      </Card>

      <div className='space-y-8'>
        {PAGE_GROUPS.map((group) => (
          <section key={group.title}>
            <div className='mb-3'>
              <h3 className='text-lg font-semibold'>{group.title}</h3>
              <p className='text-muted-foreground text-sm'>{group.description}</p>
            </div>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {group.pages.map((page) => (
                <Card key={`${group.title}-${page.label}`}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>{page.label}</CardTitle>
                    <CardDescription>{page.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {page.publicPath}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      <Button asChild size='sm'>
                        <Link to={page.adminPath}>{page.adminLabel}</Link>
                      </Button>
                      <Button asChild size='sm' variant='outline'>
                        <a
                          href={`${base}${page.publicPath}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Preview
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TourismAdminShell>
  )
}
