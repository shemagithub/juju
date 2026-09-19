import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useSiteSettingsQuery } from '../hooks/use-tourism-queries'

type AboutFormState = {
  aboutPageTitle: string
  aboutPageSubtitle: string
  aboutIntro: string
  aboutIntroExtra: string
  aboutStory: string
  aboutMission: string
  aboutVision: string
  aboutValues: string
  aboutStatTravelers: string
  aboutStatPermits: string
  aboutStatPackages: string
  aboutStatExperience: string
  aboutCtaTitle: string
  aboutCtaDescription: string
}

const ABOUT_KEYS: (keyof AboutFormState)[] = [
  'aboutPageTitle',
  'aboutPageSubtitle',
  'aboutIntro',
  'aboutIntroExtra',
  'aboutStory',
  'aboutMission',
  'aboutVision',
  'aboutValues',
  'aboutStatTravelers',
  'aboutStatPermits',
  'aboutStatPackages',
  'aboutStatExperience',
  'aboutCtaTitle',
  'aboutCtaDescription',
]

function readAbout(settings: Record<string, unknown>): AboutFormState {
  return {
    aboutPageTitle: String(settings.aboutPageTitle ?? ''),
    aboutPageSubtitle: String(settings.aboutPageSubtitle ?? ''),
    aboutIntro: String(settings.aboutIntro ?? ''),
    aboutIntroExtra: String(settings.aboutIntroExtra ?? ''),
    aboutStory: String(settings.aboutStory ?? ''),
    aboutMission: String(settings.aboutMission ?? ''),
    aboutVision: String(settings.aboutVision ?? ''),
    aboutValues: String(settings.aboutValues ?? ''),
    aboutStatTravelers: String(settings.aboutStatTravelers ?? '1000'),
    aboutStatPermits: String(settings.aboutStatPermits ?? '100'),
    aboutStatPackages: String(settings.aboutStatPackages ?? '50'),
    aboutStatExperience: String(settings.aboutStatExperience ?? '10'),
    aboutCtaTitle: String(settings.aboutCtaTitle ?? ''),
    aboutCtaDescription: String(settings.aboutCtaDescription ?? ''),
  }
}

export function TourismAboutSettingsPage() {
  const qc = useQueryClient()
  const { data = {}, isPending, refetch } = useSiteSettingsQuery()
  const settings = data as Record<string, unknown>
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<AboutFormState | null>(null)

  const form = draft ?? readAbout(settings)
  const publicBase = String(settings.publicSiteUrl ?? 'http://localhost:3000').replace(/\/$/, '')
  const brandName = String(settings.brandName ?? 'RwandaQuest')

  const set = (key: keyof AboutFormState) => (value: string) =>
    setDraft((f) => ({ ...(f ?? readAbout(settings)), [key]: value }))

  const save = async () => {
    setPending(true)
    try {
      const patch = Object.fromEntries(
        ABOUT_KEYS.map((k) => [k, form[k].trim()]),
      )
      await api.patch('/api/site-settings', patch)
      toast.success('About Us page saved')
      setDraft(null)
      await qc.invalidateQueries({ queryKey: ['site-settings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='About Us page'
      description='Story and numbers on the About page. Phone and logo come from Phone & logo.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Reload
          </Button>
          <Button variant='outline' size='sm' asChild>
            <a href={`${publicBase}/about`} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-1 size-4' />
              Preview
            </a>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/settings/contact'>Phone & logo</Link>
          </Button>
        </div>
      }
    >
      {isPending ? (
        <p className='text-muted-foreground text-sm'>Loading…</p>
      ) : (
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle>About page content</CardTitle>
            <CardDescription>
              Leave the page title empty to use “About {brandName}”.
              Put a blank line between story paragraphs. One value per line for core values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-6'
              onSubmit={(e) => {
                e.preventDefault()
                void save()
              }}
            >
              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Hero</h3>
                <div className='space-y-2'>
                  <Label>Page title (optional)</Label>
                  <Input
                    placeholder={`About ${brandName}`}
                    value={form.aboutPageTitle}
                    onChange={(e) => set('aboutPageTitle')(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Hero subtitle</Label>
                  <Textarea
                    className='min-h-[80px]'
                    value={form.aboutPageSubtitle}
                    onChange={(e) => set('aboutPageSubtitle')(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Who we are</h3>
                <div className='space-y-2'>
                  <Label>Introduction</Label>
                  <Textarea
                    className='min-h-[100px]'
                    value={form.aboutIntro}
                    onChange={(e) => set('aboutIntro')(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Second paragraph</Label>
                  <Textarea
                    className='min-h-[80px]'
                    value={form.aboutIntroExtra}
                    onChange={(e) => set('aboutIntroExtra')(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <Label>Our story</Label>
                <Textarea
                  className='min-h-[180px] text-sm leading-relaxed'
                  value={form.aboutStory}
                  onChange={(e) => set('aboutStory')(e.target.value)}
                />
              </div>

              <Separator />

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Mission</Label>
                  <Textarea
                    className='min-h-[120px]'
                    value={form.aboutMission}
                    onChange={(e) => set('aboutMission')(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Vision</Label>
                  <Textarea
                    className='min-h-[120px]'
                    value={form.aboutVision}
                    onChange={(e) => set('aboutVision')(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Core values (one per line)</Label>
                <Textarea
                  className='min-h-[120px]'
                  value={form.aboutValues}
                  onChange={(e) => set('aboutValues')(e.target.value)}
                />
              </div>

              <Separator />

              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Statistics</h3>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {(
                    [
                      ['aboutStatTravelers', 'Happy travelers'],
                      ['aboutStatPermits', 'Gorilla permits arranged'],
                      ['aboutStatPackages', 'Tour packages'],
                      ['aboutStatExperience', 'Years experience'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className='space-y-2'>
                      <Label>{label}</Label>
                      <Input
                        type='number'
                        min={0}
                        value={form[key]}
                        onChange={(e) => set(key)(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Call to action</h3>
                <div className='space-y-2'>
                  <Label>CTA title</Label>
                  <Input
                    value={form.aboutCtaTitle}
                    onChange={(e) => set('aboutCtaTitle')(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>CTA description</Label>
                  <Textarea
                    className='min-h-[80px]'
                    value={form.aboutCtaDescription}
                    onChange={(e) => set('aboutCtaDescription')(e.target.value)}
                  />
                </div>
              </div>

              <Button type='submit' disabled={pending}>
                {pending ? 'Saving…' : 'Save About page'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </TourismAdminShell>
  )
}
