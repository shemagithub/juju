import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/shared/image-uploader'
import { TourismAdminShell } from '../components/tourism-admin-shell'

type HeroSlideDto = {
  id: string
  slug: string
  region: string
  title: string
  description: string
  imageUrl: string
  cardTitle: string
  cardSubtitle: string
  link: string
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export function TourismHeroSlideFormPage({ slideId }: { slideId?: string }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isEdit = Boolean(slideId)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [slug, setSlug] = useState('')
  const [region, setRegion] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [cardTitle, setCardTitle] = useState('')
  const [cardSubtitle, setCardSubtitle] = useState('')
  const [link, setLink] = useState('/destinations')
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [meta, setMeta] = useState({ createdAt: '', updatedAt: '' })

  useEffect(() => {
    if (!slideId) return
    let cancel = false
    setLoading(true)
    void api
      .get<HeroSlideDto>(`/api/hero-slides/${slideId}`)
      .then(({ data }) => {
        if (cancel || !data) throw new Error('not found')
        setSlug(data.slug ?? '')
        setRegion(data.region ?? '')
        setTitle(data.title ?? '')
        setDescription(data.description ?? '')
        setImageUrl(data.imageUrl ?? '')
        setCardTitle(data.cardTitle ?? '')
        setCardSubtitle(data.cardSubtitle ?? '')
        setLink(data.link ?? '/destinations')
        setSortOrder(Number(data.sortOrder ?? 0))
        setActive(!!data.active)
        setMeta({
          createdAt: data.createdAt ?? '',
          updatedAt: data.updatedAt ?? '',
        })
      })
      .catch((e) => {
        handleServerError(e)
        void navigate({ to: '/website/hero', replace: true })
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [slideId, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Main title is required')
    if (!description.trim()) return toast.error('Description is required')

    const payload = {
      slug,
      region,
      title,
      description,
      imageUrl,
      cardTitle: cardTitle || title,
      cardSubtitle,
      link: link || '/destinations',
      sortOrder,
      active,
    }

    setSaving(true)
    try {
      if (isEdit && slideId) {
        await api.patch(`/api/hero-slides/${slideId}`, payload)
        toast.success('Slide saved')
      } else {
        await api.post('/api/hero-slides', payload)
        toast.success('Slide created')
      }
      await qc.invalidateQueries({ queryKey: ['hero-slides'] })
      void navigate({ to: '/website/hero', replace: true })
    } catch (err) {
      handleServerError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TourismAdminShell title='Loading…'>
        <p className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2 className='size-4 animate-spin' /> Loading slide…
        </p>
      </TourismAdminShell>
    )
  }

  return (
    <TourismAdminShell
      title={isEdit ? 'Edit hero slide' : 'Add hero slide'}
      description='Headline, photo, and button on a homepage slide.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/website/hero'>Back to hero slides</Link>
        </Button>
      }
    >
      <Card className='max-w-3xl'>
        <CardHeader>
          <CardTitle>Slide content</CardTitle>
          <CardDescription>
            Match the home hero layout: region subtitle, large title, description, card title/subtitle,
            and hero image (used for background and shuffle card).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className='space-y-4'>
            {isEdit && slideId ? (
              <div className='space-y-2'>
                <Label>ID</Label>
                <Input value={slideId} readOnly className='font-mono text-xs' />
              </div>
            ) : null}

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='hero-slug'>Slug</Label>
                <Input
                  id='hero-slug'
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder='akagera'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='hero-sort'>Sort order</Label>
                <Input
                  id='hero-sort'
                  type='number'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value || 0))}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='hero-region'>Region / subtitle *</Label>
              <Input
                id='hero-region'
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder='Eastern Province'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='hero-title'>Main title *</Label>
              <Input
                id='hero-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='AKAGERA NATIONAL PARK'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='hero-desc'>Description *</Label>
              <Textarea
                id='hero-desc'
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Experience Big Five safaris across rolling savannas…'
                required
              />
            </div>

            <ImageUploader label='Hero image' value={imageUrl} onChange={setImageUrl} />

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='hero-card-title'>Card title</Label>
                <Input
                  id='hero-card-title'
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder='AKAGERA SAFARI'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='hero-card-sub'>Card subtitle</Label>
                <Input
                  id='hero-card-sub'
                  value={cardSubtitle}
                  onChange={(e) => setCardSubtitle(e.target.value)}
                  placeholder='Rwanda — Wildlife'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='hero-link'>Discover button link</Label>
              <Input
                id='hero-link'
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder='/destinations'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox id='hero-active' checked={active} onCheckedChange={(c) => setActive(c === true)} />
              <Label htmlFor='hero-active' className='font-normal'>
                Visible on home page
              </Label>
            </div>

            {isEdit ? (
              <div className='text-muted-foreground grid gap-1 text-xs sm:grid-cols-2'>
                <p>Created: {meta.createdAt ? new Date(meta.createdAt).toLocaleString() : '—'}</p>
                <p>Updated: {meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : '—'}</p>
              </div>
            ) : null}

            <div className='flex gap-2 pt-2'>
              <Button type='submit' disabled={saving}>
                {saving ? <Loader2 className='size-4 animate-spin' /> : null}{' '}
                {isEdit ? 'Save changes' : 'Create slide'}
              </Button>
              <Button type='button' variant='outline' asChild>
                <Link to='/website/hero'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}
