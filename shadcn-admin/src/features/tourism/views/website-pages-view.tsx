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
    title: 'Sell trips',
    description: 'What visitors book.',
    pages: [
      {
        label: 'Home',
        publicPath: '/',
        adminPath: '/website/hero',
        adminLabel: 'Edit',
        summary: 'Big pictures and headlines at the top',
      },
      {
        label: 'Packages',
        publicPath: '/packages',
        adminPath: '/tour-packages',
        adminLabel: 'Edit',
        summary: 'Gorilla treks, safaris, and tours',
      },
      {
        label: 'Destinations',
        publicPath: '/destinations',
        adminPath: '/destinations',
        adminLabel: 'Edit',
        summary: 'Places in the travel guide',
      },
      {
        label: 'Car rental',
        publicPath: '/car-rental',
        adminPath: '/car-rental/vehicles',
        adminLabel: 'Edit',
        summary: 'Cars people can request',
      },
    ],
  },
  {
    title: 'Company',
    description: 'Who you are and how to reach you.',
    pages: [
      {
        label: 'About us',
        publicPath: '/about',
        adminPath: '/settings/about',
        adminLabel: 'Edit',
        summary: 'Story, mission, and numbers',
      },
      {
        label: 'Team',
        publicPath: '/about#team',
        adminPath: '/settings/team',
        adminLabel: 'Edit',
        summary: 'People on the About page',
      },
      {
        label: 'Contact',
        publicPath: '/contact',
        adminPath: '/settings/contact',
        adminLabel: 'Edit',
        summary: 'Logo, phone, email, and address',
      },
    ],
  },
  {
    title: 'Stories & photos',
    description: 'What you publish.',
    pages: [
      {
        label: 'Blog',
        publicPath: '/blog',
        adminPath: '/blog',
        adminLabel: 'Edit',
        summary: 'Articles with photos in the text',
      },
      {
        label: 'Photos',
        publicPath: '/gallery',
        adminPath: '/gallery',
        adminLabel: 'Edit',
        summary: 'Gallery on the website',
      },
      {
        label: 'Reviews',
        publicPath: '/',
        adminPath: '/reviews',
        adminLabel: 'Edit',
        summary: 'Approve a review to show it on Home',
      },
    ],
  },
  {
    title: 'Legal',
    description: 'Pages linked in the footer.',
    pages: [
      {
        label: 'Privacy',
        publicPath: '/privacy',
        adminPath: '/settings/legal',
        adminLabel: 'Edit',
        summary: 'Privacy policy',
      },
      {
        label: 'Terms',
        publicPath: '/terms',
        adminPath: '/settings/legal',
        adminLabel: 'Edit',
        summary: 'Terms and conditions',
      },
    ],
  },
]

export function TourismWebsitePagesView() {
  const { data: settings = {} } = useSiteSettingsQuery()
  const base = String(
    (settings as Record<string, string>).publicSiteUrl || 'http://localhost:3000',
  ).replace(/\/$/, '')

  return (
    <TourismAdminShell
      title='Edit website'
      description='Pick a page, change it, then Preview on the live site.'
    >
      <Card className='mb-6 border-primary/20 bg-primary/5'>
        <CardHeader>
          <CardTitle>Website</CardTitle>
          <CardDescription>
            Changes save here, then show on the live travel site.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button asChild>
            <a href={base} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-2 size-4' />
              Open live site
            </a>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/settings/contact'>Phone & logo</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/settings/content'>Homepage text</Link>
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
                  <CardContent>
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
