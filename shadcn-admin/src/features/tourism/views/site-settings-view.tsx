import { useState, type ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
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

type NavLink = { to: string; label: string; end?: boolean }

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
      ? 'Google listing'
      : section === 'social'
        ? 'Social links'
        : section === 'contact'
          ? 'Phone & logo'
          : section === 'navigation'
            ? 'Website menu'
            : 'Homepage text'

  return (
    <TourismAdminShell
      title={title}
      description='These details show on the public website.'
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
            <CardTitle>Homepage text</CardTitle>
            <CardDescription>The first words visitors see on the homepage.</CardDescription>
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
            <CardTitle>Phone & logo</CardTitle>
            <CardDescription>
              Logo, phone, and address shown on the website.
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
            <CardTitle>Menu at the top</CardTitle>
            <CardDescription>Names and pages in the website header.</CardDescription>
          </CardHeader>
          <CardContent>
            <NavigationForm
              initial={Array.isArray(settings.navLinks) ? (settings.navLinks as NavLink[]) : []}
              onSave={(navLinks) => merge({ navLinks })}
              pending={pending}
            />
          </CardContent>
        </Card>
      ) : section === 'seo' ? (
        <Card className='max-w-xl'>
          <CardHeader>
            <CardTitle>Google listing</CardTitle>
            <CardDescription>Title and snippet shown in search results.</CardDescription>
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
            <CardTitle>Social links</CardTitle>
            <CardDescription>Shown in the website footer.</CardDescription>
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
        <Label>Big headline</Label>
        <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>Line under the headline</Label>
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
        <Label>Title on Google</Label>
        <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
      </div>
      <div className='space-y-2'>
        <Label>Short description on Google</Label>
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
        <h3 className='text-sm font-medium'>Company</h3>
        <div className='space-y-2'>
          <Label>Company name</Label>
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
            placeholder='A short line about the company for the footer and contact page.'
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
        <h3 className='text-sm font-medium'>Website address</h3>
        <div className='space-y-2'>
          <Label>Live website URL</Label>
          <Input className='w-full' value={form.publicSiteUrl} onChange={set('publicSiteUrl')} />
          <p className='text-muted-foreground text-xs'>
            Used for Preview. Example: https://rwandaquesttours.com
          </p>
        </div>
      </div>

      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

function NavigationForm({
  initial,
  onSave,
  pending,
}: {
  initial: NavLink[]
  onSave: (navLinks: NavLink[]) => void
  pending: boolean
}) {
  const [links, setLinks] = useState<NavLink[]>(
    initial.length
      ? initial.map((link) => ({
          to: String(link.to ?? ''),
          label: String(link.label ?? ''),
          end: Boolean(link.end),
        }))
      : [{ to: '/', label: 'Home', end: true }],
  )

  const update = (index: number, patch: Partial<NavLink>) => {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    )
  }

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        onSave(
          links
            .map((link) => ({
              to: link.to.trim(),
              label: link.label.trim(),
              ...(link.end ? { end: true } : {}),
            }))
            .filter((link) => link.to && link.label),
        )
      }}
    >
      <div className='space-y-3'>
        {links.map((link, index) => (
          <div key={index} className='grid gap-2 sm:grid-cols-[1fr_1fr_auto]'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={link.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder='Packages'
              />
            </div>
            <div className='space-y-1'>
              <Label>Page</Label>
              <Input
                value={link.to}
                onChange={(e) => update(index, { to: e.target.value })}
                placeholder='/packages'
              />
            </div>
            <div className='flex items-end'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                aria-label='Remove menu item'
                onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}
                disabled={links.length <= 1}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setLinks((current) => [...current, { to: '', label: '' }])}
        >
          <Plus className='me-1 size-4' />
          Add page
        </Button>
        <Button type='submit' disabled={pending}>
          {pending ? 'Saving…' : 'Save menu'}
        </Button>
      </div>
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
