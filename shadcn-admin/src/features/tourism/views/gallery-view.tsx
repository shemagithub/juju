import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useGalleryQuery } from '../hooks/use-tourism-queries'
import { ImageUploader } from '@/components/shared/image-uploader'
import { resolveAssetUrl } from '@/lib/asset-url'

type Item = {
  id: string
  url: string
  type: string
  category: string
  caption: string
  updatedAt: string
}

export function TourismGalleryPage({ variant }: { variant: 'list' | 'upload' }) {
  if (variant === 'upload') return <GalleryUploadPage />
  return <GalleryListPage />
}

function GalleryListPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useGalleryQuery()
  const [viewItem, setViewItem] = useState<Item | null>(null)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    if (!editItem.url.trim()) return toast.error('Image URL is required')
    setEditSaving(true)
    try {
      await api.patch(`/api/gallery/${editItem.id}`, {
        url: editItem.url.trim(),
        type: editItem.type,
        category: editItem.category,
        caption: editItem.caption,
      })
      toast.success('Media updated')
      setEditItem(null)
      await qc.invalidateQueries({ queryKey: ['gallery'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await api.delete(`/api/gallery/${deleteItem.id}`)
      toast.success('Media deleted')
      setDeleteItem(null)
      await qc.invalidateQueries({ queryKey: ['gallery'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title='Media gallery'
      description='Image URLs (CDN or uploads). Video support depends on storage integration.'
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
          <Button size='sm' asChild>
            <Link to='/gallery/upload'>
              <Plus className='me-1 size-4' />
              Upload
            </Link>
          </Button>
        </div>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {isPending ? (
          <p className='text-muted-foreground text-sm'>Loading…</p>
        ) : (
          (data as Item[]).map((g) => (
            <Card key={g.id}>
              <CardContent className='p-2'>
                <div className='bg-muted relative aspect-video overflow-hidden rounded-md'>
                  {g.type === 'image' ? (
                    <img
                      src={resolveAssetUrl(g.url)}
                      alt={g.caption}
                      className='size-full object-cover'
                    />
                  ) : (
                    <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
                      {g.type}
                    </div>
                  )}
                </div>
                <div className='mt-2 flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{g.caption || '—'}</p>
                    <p className='text-muted-foreground text-xs'>{g.category}</p>
                  </div>
                  <ResourceRowActions
                    itemLabel={g.caption || g.category || 'media'}
                    onView={() => setViewItem(g)}
                    onEdit={() => setEditItem({ ...g })}
                    onDelete={() => setDeleteItem(g)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ResourceViewDialog
        open={!!viewItem}
        onOpenChange={(o) => !o && setViewItem(null)}
        title={viewItem?.caption || 'Gallery item'}
        description={viewItem?.id}
        onEdit={viewItem ? () => setEditItem({ ...viewItem }) : undefined}
      >
        {viewItem ? (
          <div className='space-y-3 text-sm'>
            {viewItem.type === 'image' ? (
              <img
                src={resolveAssetUrl(viewItem.url)}
                alt={viewItem.caption}
                className='max-h-[50vh] w-full rounded-md object-contain'
              />
            ) : null}
            <p>
              <span className='text-muted-foreground'>Category:</span> {viewItem.category}
            </p>
            <p>
              <span className='text-muted-foreground'>Type:</span> {viewItem.type}
            </p>
            <p className='break-all'>
              <span className='text-muted-foreground'>URL:</span> {viewItem.url}
            </p>
            <p>
              <span className='text-muted-foreground'>Updated:</span>{' '}
              {new Date(viewItem.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        title='Edit media'
        itemName={editItem?.caption || editItem?.category}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editItem ? (
          <>
            <ImageUploader
              label='Image'
              value={editItem.url}
              onChange={(url) => setEditItem({ ...editItem, url })}
              required
            />
            <div className='space-y-2'>
              <Label htmlFor='gcat'>Category</Label>
              <Input
                id='gcat'
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='gcap'>Caption</Label>
              <Input
                id='gcap'
                value={editItem.caption}
                onChange={(e) => setEditItem({ ...editItem, caption: e.target.value })}
              />
            </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title='Delete media?'
        desc={deleteItem ? <>Remove “{deleteItem.caption || deleteItem.id}” from the gallery.</> : ''}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}

function GalleryUploadPage() {
  const qc = useQueryClient()
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('wildlife')
  const [caption, setCaption] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return toast.error('Image is required')
    setPending(true)
    try {
      await api.post('/api/gallery', {
        url: url.trim(),
        type: 'image',
        category,
        caption,
      })
      toast.success('Media item saved')
      await qc.invalidateQueries({ queryKey: ['gallery'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      setUrl('')
      setCaption('')
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='Upload media'
      description='Upload an image (drag & drop) or paste a public image URL.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/gallery'>Back</Link>
        </Button>
      }
    >
      <Card className='max-w-md'>
        <CardHeader>
          <CardTitle>Add image</CardTitle>
          <CardDescription>Upload a file or use a URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className='space-y-4'>
            <ImageUploader label='Image' value={url} onChange={setUrl} required />
            <div className='space-y-2'>
              <Label htmlFor='cat'>Category</Label>
              <Input
                id='cat'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cap'>Caption</Label>
              <Input
                id='cap'
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}
