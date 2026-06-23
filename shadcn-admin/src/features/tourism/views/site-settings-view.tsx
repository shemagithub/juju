import { useState, type ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { applyAdminSiteMeta } from '@/lib/apply-site-meta'
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
import { ImageUploader } from '@/components/shared/image-uploader'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useSiteSettingsQuery } from '../hooks/use-tourism-queries'

export function TourismSiteSettingsPage({
  section,
}: {
  section: 'content' | 'contact' | 'navigation' | 'seo' | 'social'
}) {
  const qc = useQueryClient()
  const { data = {}, isPending, refetch } = useSiteSettingsQuery()
  const [pending, setPending] = useState(false)

  const settings = data as Record<string, unknown>

  const merge = async (patch: Record<string, unknown>) => {
    setPending(true)
    try {
      const { data: next } = await api.patch<Record<string, unknown>>('/api/site-settings', patch)
      applyAdminSiteMeta(next ?? { ...settings, ...patch })
      toast.success('Settings saved')
      await qc.invalidateQueries({ queryKey: ['site-settings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setPending(false)
    }
  }

  const title =
    section === 'seo'
      ? 'SEO settings'
      : section === 'social'
        ? 'Social links'
        : section === 'contact'
          ? 'Contact & brand'
          : section === 'navigation'
            ? 'Navigation'
            : 'Website content'

  return (
    <TourismAdminShell
      title={title}
      description='Stored as JSON in `site_settings`. Public site reads the same API.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Reload
        </Button>
      }
    >
      {isPending ? (
        <p className='text-muted-foreground text-sm'>Loading…</p>
      ) : section === 'content' ? (
        <Card className='max-w-xl'>
          <CardHeader>
            <CardTitle>Homepage & general copy</CardTitle>
            <CardDescription>Key/value fields merged into site payload.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentForm
              initial={{
                heroTitle: String(settings.heroTitle ?? ''),
                heroSubtitle: String(settings.heroSubtitle ?? ''),
              }}
              onSave={(v) => merge(v)}
              pending={pending}
            />
          </CardContent>
        </Card>
      ) : section === 'contact' ? (
        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>Contact & brand</CardTitle>
            <CardDescription>
              Logo, company description, and contact details shown on the public site header, footer,
              and contact page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm
              initial={{
                brandName: String(settings.brandName ?? ''),
                logoUrl: String(settings.logoUrl ?? ''),
                companyDescription: String(
                  settings.companyDescription ?? settings.footerDescription ?? '',
                ),
                contactEmail: String(settings.contactEmail ?? ''),
                contactPhone: String(settings.contactPhone ?? ''),
                emergencyPhone: String(settings.emergencyPhone ?? ''),
                whatsapp: String(settings.whatsapp ?? ''),
                address: String(settings.address ?? ''),
                workingHours: String(settings.workingHours ?? ''),
                publicSiteUrl: String(settings.publicSiteUrl ?? 'http://localhost:3000'),
              }}
              onSave={(v) =>
                merge({
                  ...v,
                  footerDescription: v.companyDescription,
                })
              }
              pending={pending}
            />
          </CardContent>
        </Card>
      ) : section === 'navigation' ? (
        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>Header navigation</CardTitle>
            <CardDescription>JSON array synced to travel-app header nav links.</CardDescription>
          </CardHeader>
          <CardContent>
            <NavigationForm
              initial={JSON.stringify(settings.navLinks ?? [], null, 2)}
              onSave={(navLinks) => merge({ navLinks })}
              pending={pending}
            />
          </CardContent>
        </Card>
      ) : section === 'seo' ? (
        <Card className='max-w-xl'>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <SeoForm
              initial={{
                metaTitle: String(settings.metaTitle ?? ''),
                metaDescription: String(settings.metaDescription ?? ''),
              }}
              onSave={(v) => merge(v)}
              pending={pending}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className='max-w-xl'>
          <CardHeader>
            <CardTitle>Social</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialForm
              initial={{
                facebook: String(settings.facebook ?? ''),
                instagram: String(settings.instagram ?? ''),
                twitter: String(settings.twitter ?? ''),
                youtube: String(settings.youtube ?? ''),
              }}
              onSave={(v) => merge(v)}
              pending={pending}
            />
          </CardContent>
        </Card>
      )}
    </TourismAdminShell>
  )
}

function ContentForm({
  initial,
  onSave,
  pending,
}: {
  initial: {
    heroTitle: string
    heroSubtitle: string
  }
  onSave: (v: Record<string, string>) => void
  pending: boolean
}) {
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle)
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle)
  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ heroTitle, heroSubtitle })
      }}
    >
      <div className='space-y-2'>
        <Label>Hero title</Label>
        <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>Hero subtitle</Label>
        <Textarea
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
        />
      </div>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

function SeoForm({
  initial,
  onSave,
  pending,
}: {
  initial: { metaTitle: string; metaDescription: string }
  onSave: (v: Record<string, string>) => void
  pending: boolean
}) {
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle)
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription)
  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ metaTitle, metaDescription })
      }}
    >
      <div className='space-y-2'>
        <Label>Meta title</Label>
        <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>Meta description</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
        />
      </div>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

function ContactForm({
  initial,
  onSave,
  pending,
}: {
  initial: {
    brandName: string
    logoUrl: string
    companyDescription: string
    contactEmail: string
    contactPhone: string
    emergencyPhone: string
    whatsapp: string
    address: string
    workingHours: string
    publicSiteUrl: string
  }
  onSave: (v: Record<string, string>) => void
  pending: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof initial) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <form
      className='space-y-6'
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <div className='space-y-4'>
        <h3 className='text-sm font-medium'>Brand identity</h3>
        <div className='space-y-2'>
          <Label>Brand name</Label>
          <Input className='w-full' value={form.brandName} onChange={set('brandName')} />
        </div>
        <ImageUploader
          label='Company logo'
          value={form.logoUrl}
          onChange={(logoUrl) => setForm((f) => ({ ...f, logoUrl }))}
        />
        <div className='space-y-2'>
          <Label>Company description</Label>
          <Textarea
            className='min-h-[120px]'
            value={form.companyDescription}
            onChange={set('companyDescription')}
            placeholder='Short description of your company for the footer, contact page, and about sections.'
          />
        </div>
      </div>

      <Separator />

      <div className='space-y-4'>
        <h3 className='text-sm font-medium'>Contact details</h3>
        {(
          [
            ['contactEmail', 'Contact email'],
            ['contactPhone', 'Phone display'],
            ['emergencyPhone', 'Emergency phone (24/7 tours)'],
            ['whatsapp', 'WhatsApp number (no +)'],
            ['address', 'Address'],
            ['workingHours', 'Working hours'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className='space-y-2'>
            <Label>{label}</Label>
            <Input className='w-full' value={form[key]} onChange={set(key)} />
          </div>
        ))}
      </div>

      <Separator />

      <div className='space-y-4'>
        <h3 className='text-sm font-medium'>Site preview</h3>
        <div className='space-y-2'>
          <Label>Public site URL</Label>
          <Input className='w-full' value={form.publicSiteUrl} onChange={set('publicSiteUrl')} />
          <p className='text-muted-foreground text-xs'>
            Used for preview links in admin. Example: http://localhost:3000
          </p>
        </div>
      </div>

      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save contact & brand'}
      </Button>
    </form>
  )
}

function NavigationForm({
  initial,
  onSave,
  pending,
}: {
  initial: string
  onSave: (navLinks: unknown[]) => void
  pending: boolean
}) {
  const [raw, setRaw] = useState(initial)
  const [error, setError] = useState('')
  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        try {
          const parsed = JSON.parse(raw)
          if (!Array.isArray(parsed)) throw new Error('Must be a JSON array')
          setError('')
          onSave(parsed)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invalid JSON')
        }
      }}
    >
      <Textarea
        className='min-h-[240px] font-mono text-xs'
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      {error ? <p className='text-destructive text-sm'>{error}</p> : null}
      <p className='text-muted-foreground text-xs'>
        Example: [{'{'}&quot;to&quot;:&quot;/&quot;,&quot;label&quot;:&quot;Home&quot;,&quot;end&quot;:true{'}'}]
      </p>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save navigation'}
      </Button>
    </form>
  )
}

function SocialForm({
  initial,
  onSave,
  pending,
}: {
  initial: { facebook: string; instagram: string; twitter: string; youtube: string }
  onSave: (v: Record<string, string>) => void
  pending: boolean
}) {
  const [facebook, setFacebook] = useState(initial.facebook)
  const [instagram, setInstagram] = useState(initial.instagram)
  const [twitter, setTwitter] = useState(initial.twitter)
  const [youtube, setYoutube] = useState(initial.youtube)
  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ facebook, instagram, twitter, youtube })
      }}
    >
      <div className='space-y-2'>
        <Label>Facebook URL</Label>
        <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>Instagram URL</Label>
        <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>X / Twitter URL</Label>
        <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>YouTube URL</Label>
        <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} />
      </div>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
