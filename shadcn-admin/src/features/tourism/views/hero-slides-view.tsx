import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Plus, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { resolveAssetUrl } from '@/lib/asset-url'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useHeroSlidesQuery } from '../hooks/use-tourism-queries'

type HeroSlide = {
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
}

export function TourismHeroSlidesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data = [], isPending, refetch, isFetching } = useHeroSlidesQuery()
  const [viewSlide, setViewSlide] = useState<HeroSlide | null>(null)
  const [deleteSlide, setDeleteSlide] = useState<HeroSlide | null>(null)
  const [deleting, setDeleting] = useState(false)

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await api.patch(`/api/hero-slides/${id}`, { active })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero-slides'] })
      toast.success('Slide updated')
    },
    onError: handleServerError,
  })

  const doDelete = async () => {
    if (!deleteSlide) return
    setDeleting(true)
    try {
      await api.delete(`/api/hero-slides/${deleteSlide.id}`)
      toast.success('Slide removed')
      setDeleteSlide(null)
      await qc.invalidateQueries({ queryKey: ['hero-slides'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setDeleting(false)
    }
  }

  const rows = [...(data as HeroSlide[])].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <TourismAdminShell
      title='Home hero slides'
      description='Manage the GLOBE EXPRESS shuffle hero on the public home page — region, title, description, card labels, image, and link.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className={`me-1 size-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size='sm' asChild>
            <Link to='/website/hero/new'>
              <Plus className='me-1 size-4' />
              Add slide
            </Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Hero carousel</CardTitle>
          <CardDescription>
            Active slides appear in order on the home page. Each slide drives the large background,
            left text panel, and one shuffle card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : rows.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No slides yet —{' '}
              <Link className='text-primary underline underline-offset-4' to='/website/hero/new'>
                add the first slide
              </Link>
              .
            </p>
          ) : (
            <div className='divide-y rounded-md border'>
              {rows.map((slide) => {
                const src = resolveAssetUrl(slide.imageUrl)
                return (
                  <div
                    key={slide.id}
                    className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center'
                  >
                    <div className='bg-muted relative h-24 w-full shrink-0 overflow-hidden rounded-md sm:h-20 sm:w-32'>
                      {src ? (
                        <img alt='' className='h-full w-full object-cover' src={src} />
                      ) : (
                        <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-0.5 text-xs'>
                          <ImageIcon className='size-4 opacity-50' />
                          No image
                        </div>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-semibold'>{slide.title}</span>
                        <Badge variant='outline' className='font-mono text-xs'>
                          {slide.slug || slide.id.slice(0, 8)}
                        </Badge>
                        <Badge variant={slide.active ? 'default' : 'secondary'}>
                          {slide.active ? 'Live' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-xs'>{slide.region}</p>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                        {slide.description}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Card: <strong>{slide.cardTitle}</strong> · {slide.cardSubtitle} · sort{' '}
                        {slide.sortOrder} · {slide.link}
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 sm:justify-end'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => toggleActive.mutate({ id: slide.id, active: !slide.active })}
                      >
                        {slide.active ? 'Hide' : 'Activate'}
                      </Button>
                      <ResourceRowActions
                        itemLabel={slide.title}
                        onView={() => setViewSlide(slide)}
                        editTo='/website/hero/$slideId'
                        editParams={{ slideId: slide.id }}
                        onDelete={() => setDeleteSlide(slide)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewSlide}
        onOpenChange={(o) => !o && setViewSlide(null)}
        title={viewSlide?.title ?? 'Hero slide'}
        description={viewSlide?.slug || viewSlide?.id}
        size='2xl'
        editLabel='Open editor'
        onEdit={
          viewSlide
            ? () =>
                navigate({
                  to: '/website/hero/$slideId',
                  params: { slideId: viewSlide.id },
                })
            : undefined
        }
      >
        {viewSlide ? (
          <div className='space-y-3 text-sm'>
            {resolveAssetUrl(viewSlide.imageUrl) ? (
              <img
                alt=''
                className='max-h-[40vh] w-full rounded-md object-cover'
                src={resolveAssetUrl(viewSlide.imageUrl)}
              />
            ) : null}
            <p>
              <span className='text-muted-foreground'>Region:</span> {viewSlide.region}
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span>{' '}
              {viewSlide.active ? 'Live' : 'Hidden'} · sort {viewSlide.sortOrder}
            </p>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Description</p>
              <p className='mt-1 whitespace-pre-wrap'>{viewSlide.description}</p>
            </div>
            <p>
              <span className='text-muted-foreground'>Card title:</span> {viewSlide.cardTitle}
            </p>
            <p>
              <span className='text-muted-foreground'>Card subtitle:</span> {viewSlide.cardSubtitle}
            </p>
            <p className='break-all'>
              <span className='text-muted-foreground'>Link:</span> {viewSlide.link}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ConfirmDialog
        open={!!deleteSlide}
        onOpenChange={(o) => !o && setDeleteSlide(null)}
        title='Delete hero slide?'
        desc={deleteSlide ? <>Remove “{deleteSlide.title}” from the home hero.</> : ''}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
