import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ImageUploader } from '@/components/shared/image-uploader'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { resolveAssetUrl } from '@/lib/asset-url'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { REVIEW_STATUSES } from '../lib/status-options'
import { useReviewsQuery, useTourPackagesQuery, useUsersApiQuery } from '../hooks/use-tourism-queries'

type Rev = {
  id: string
  userId: string
  packageId: string
  authorName?: string
  authorCountry?: string
  photoUrl?: string
  rating: number
  comment: string
  status: string
  featured: boolean
  createdAt: string
}

type ReviewForm = {
  authorName: string
  authorCountry: string
  photoUrl: string
  userId: string
  packageId: string
  rating: number
  comment: string
  status: string
  featured: boolean
}

function emptyReviewForm(): ReviewForm {
  return {
    authorName: '',
    authorCountry: '',
    photoUrl: '',
    userId: '',
    packageId: '',
    rating: 5,
    comment: '',
    status: 'approved',
    featured: false,
  }
}

function displayName(r: Rev, userLabel: (id: string) => string) {
  return r.authorName?.trim() || userLabel(r.userId)
}

export function TourismReviewsPage({ pendingOnly }: { pendingOnly?: boolean }) {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useReviewsQuery()
  const { data: packages = [] } = useTourPackagesQuery()
  const { data: users = [] } = useUsersApiQuery()

  const [viewR, setViewR] = useState<Rev | null>(null)
  const [editR, setEditR] = useState<Rev | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<ReviewForm>(emptyReviewForm())
  const [createSaving, setCreateSaving] = useState(false)
  const [deleteR, setDeleteR] = useState<Rev | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pkgTitle = (id: string) =>
    (packages as { id: string; title: string }[]).find((p) => p.id === id)?.title ?? id
  const userLabel = (id: string) => {
    const u = (users as { id: string; firstName: string; lastName: string }[]).find(
      (x) => x.id === id,
    )
    return u ? `${u.firstName} ${u.lastName}`.trim() : id.slice(0, 8)
  }

  const list = pendingOnly
    ? (data as Rev[]).filter((r) => r.status === 'pending')
    : (data as Rev[])

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<Rev, 'status' | 'featured' | 'rating' | 'comment'>>
    }) => {
      await api.patch(`/api/reviews/${id}`, patch)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      toast.success('Review updated — author notified by email when status changes')
    },
    onError: handleServerError,
  })

  const saveCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const authorName = createForm.authorName.trim()
    const comment = createForm.comment.trim()
    if (!authorName && !createForm.userId) {
      return toast.error('Enter a guest name or link a customer account')
    }
    if (!createForm.packageId) return toast.error('Select a tour package')
    if (!comment) return toast.error('Comment is required')
    setCreateSaving(true)
    try {
      await api.post('/api/reviews', {
        authorName,
        authorCountry: createForm.authorCountry.trim(),
        photoUrl: createForm.photoUrl.trim(),
        userId: createForm.userId || undefined,
        packageId: createForm.packageId,
        rating: createForm.rating,
        comment,
        status: createForm.status,
        featured: createForm.featured,
      })
      toast.success('Review created')
      setCreateOpen(false)
      setCreateForm(emptyReviewForm())
      await qc.invalidateQueries({ queryKey: ['reviews'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setCreateSaving(false)
    }
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editR) return
    setEditSaving(true)
    try {
      await api.patch(`/api/reviews/${editR.id}`, {
        authorName: editR.authorName,
        authorCountry: editR.authorCountry,
        photoUrl: editR.photoUrl,
        packageId: editR.packageId,
        userId: editR.userId,
        rating: editR.rating,
        comment: editR.comment,
        status: editR.status,
        featured: editR.featured,
      })
      toast.success('Review saved')
      setEditR(null)
      await qc.invalidateQueries({ queryKey: ['reviews'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteR) return
    setDeleting(true)
    try {
      await api.delete(`/api/reviews/${deleteR.id}`)
      toast.success('Review deleted')
      setDeleteR(null)
      await qc.invalidateQueries({ queryKey: ['reviews'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title={pendingOnly ? 'Reviews pending approval' : 'All reviews'}
      description='Approve a review to show it on the website.'
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
          <Button
            size='sm'
            onClick={() => {
              setCreateForm(emptyReviewForm())
              setCreateOpen(true)
            }}
          >
            <Plus className='me-1 size-4' />
            Add review
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>Star rating and moderation status.</CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='whitespace-nowrap text-sm'>
                      <div className='flex items-center gap-2'>
                        {r.photoUrl ? (
                          <img
                            src={resolveAssetUrl(r.photoUrl)}
                            alt=''
                            className='size-8 shrink-0 rounded-full border object-cover'
                          />
                        ) : (
                          <div className='bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium'>
                            {displayName(r, userLabel).charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          {displayName(r, userLabel)}
                          {r.authorCountry ? (
                            <span className='text-muted-foreground block text-xs'>{r.authorCountry}</span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-[10rem] truncate text-sm'>
                      {pkgTitle(r.packageId)}
                    </TableCell>
                    <TableCell>{'★'.repeat(Math.min(5, r.rating))}</TableCell>
                    <TableCell className='max-w-md truncate'>{r.comment}</TableCell>
                    <TableCell>
                      <AdminStatusSelect
                        value={r.status}
                        options={REVIEW_STATUSES}
                        disabled={update.isPending}
                        onChange={(status) =>
                          update.mutate({ id: r.id, patch: { status } })
                        }
                      />
                    </TableCell>
                    <TableCell>{r.featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={`review by ${displayName(r, userLabel)}`}
                        onView={() => setViewR(r)}
                        onEdit={() => setEditR({ ...r })}
                        onDelete={() => setDeleteR(r)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewR}
        onOpenChange={(o) => !o && setViewR(null)}
        title='Review'
        description={
          viewR
            ? `${displayName(viewR, userLabel)}${viewR.authorCountry ? ` · ${viewR.authorCountry}` : ''} · ${pkgTitle(viewR.packageId)}`
            : undefined
        }
        onEdit={viewR ? () => setEditR({ ...viewR }) : undefined}
      >
        {viewR ? (
          <div className='space-y-3 text-sm'>
            {viewR.photoUrl ? (
              <img
                src={resolveAssetUrl(viewR.photoUrl)}
                alt={displayName(viewR, userLabel)}
                className='size-16 rounded-full border object-cover'
              />
            ) : null}
            <p>
              {'★'.repeat(Math.min(5, viewR.rating))} ({viewR.rating}/5)
            </p>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Comment</p>
              <p className='mt-1 whitespace-pre-wrap'>{viewR.comment}</p>
            </div>
            <p>
              <span className='text-muted-foreground'>Status:</span> {viewR.status} · Featured:{' '}
              {viewR.featured ? 'Yes' : 'No'}
            </p>
            <p className='text-muted-foreground text-xs'>
              {new Date(viewR.createdAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editR}
        onOpenChange={(o) => !o && setEditR(null)}
        title='Edit review'
        itemName={editR ? `${displayName(editR, userLabel)} · ${pkgTitle(editR.packageId)}` : undefined}
        onSubmit={saveEdit}
        saving={editSaving}
        size='lg'
      >
        {editR ? (
          <>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='ean'>Guest name</Label>
                <Input
                  id='ean'
                  value={editR.authorName ?? ''}
                  onChange={(e) => setEditR({ ...editR, authorName: e.target.value })}
                  placeholder='Sarah Johnson'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='eac'>Country</Label>
                <Input
                  id='eac'
                  value={editR.authorCountry ?? ''}
                  onChange={(e) => setEditR({ ...editR, authorCountry: e.target.value })}
                  placeholder='USA'
                />
              </div>
            </div>
            <ImageUploader
              label='Profile photo'
              value={editR.photoUrl ?? ''}
              onChange={(url) => setEditR({ ...editR, photoUrl: url })}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='epkg'>Tour package</Label>
                <select
                  id='epkg'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editR.packageId}
                  onChange={(e) => setEditR({ ...editR, packageId: e.target.value })}
                >
                  {(packages as { id: string; title: string }[]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='eusr'>Linked customer (optional)</Label>
                <select
                  id='eusr'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editR.userId}
                  onChange={(e) => setEditR({ ...editR, userId: e.target.value })}
                >
                  <option value=''>— Guest only —</option>
                  {(users as { id: string; firstName: string; lastName: string }[]).map((u) => (
                    <option key={u.id} value={u.id}>
                      {`${u.firstName} ${u.lastName}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rr'>Rating (1–5)</Label>
              <Input
                id='rr'
                type='number'
                min={1}
                max={5}
                value={editR.rating}
                onChange={(e) =>
                  setEditR({ ...editR, rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rc'>Comment</Label>
              <Textarea
                id='rc'
                value={editR.comment}
                onChange={(e) => setEditR({ ...editR, comment: e.target.value })}
                rows={5}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rs'>Status</Label>
              <select
                id='rs'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={editR.status}
                onChange={(e) => setEditR({ ...editR, status: e.target.value })}
              >
                <option value='pending'>pending</option>
                <option value='approved'>approved</option>
                <option value='rejected'>rejected</option>
              </select>
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={editR.featured}
                onChange={(e) => setEditR({ ...editR, featured: e.target.checked })}
              />
              Featured
            </label>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => update.mutate({ id: editR.id, patch: { status: 'approved' } })}
              >
                Approve
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => update.mutate({ id: editR.id, patch: { status: 'rejected' } })}
              >
                Reject
              </Button>
            </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ResourceEditDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) setCreateForm(emptyReviewForm())
        }}
        title='Add review'
        description='Approved reviews show on Home and About.'
        onSubmit={saveCreate}
        saving={createSaving}
        saveLabel='Create review'
        size='lg'
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='can'>Guest name</Label>
            <Input
              id='can'
              value={createForm.authorName}
              onChange={(e) => setCreateForm((f) => ({ ...f, authorName: e.target.value }))}
              placeholder='Sarah Johnson'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='cac'>Country</Label>
            <Input
              id='cac'
              value={createForm.authorCountry}
              onChange={(e) => setCreateForm((f) => ({ ...f, authorCountry: e.target.value }))}
              placeholder='USA'
            />
          </div>
        </div>
        <ImageUploader
          label='Profile photo'
          value={createForm.photoUrl}
          onChange={(url) => setCreateForm((f) => ({ ...f, photoUrl: url }))}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='cpkg'>Tour package</Label>
            <select
              id='cpkg'
              className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
              value={createForm.packageId}
              onChange={(e) => setCreateForm((f) => ({ ...f, packageId: e.target.value }))}
              required
            >
              <option value=''>— Select package —</option>
              {(packages as { id: string; title: string }[]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='cusr'>Linked customer (optional)</Label>
            <select
              id='cusr'
              className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
              value={createForm.userId}
              onChange={(e) => setCreateForm((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value=''>— Guest only —</option>
              {(users as { id: string; firstName: string; lastName: string }[]).map((u) => (
                <option key={u.id} value={u.id}>
                  {`${u.firstName} ${u.lastName}`.trim()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='cr'>Rating (1–5)</Label>
          <Input
            id='cr'
            type='number'
            min={1}
            max={5}
            value={createForm.rating}
            onChange={(e) =>
              setCreateForm((f) => ({
                ...f,
                rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
              }))
            }
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='cc'>Comment</Label>
          <Textarea
            id='cc'
            value={createForm.comment}
            onChange={(e) => setCreateForm((f) => ({ ...f, comment: e.target.value }))}
            rows={5}
            placeholder='What did they love about the trip?'
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='cs'>Status</Label>
          <select
            id='cs'
            className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
            value={createForm.status}
            onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value='approved'>approved (visible on site)</option>
            <option value='pending'>pending</option>
            <option value='rejected'>rejected</option>
          </select>
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={createForm.featured}
            onChange={(e) => setCreateForm((f) => ({ ...f, featured: e.target.checked }))}
          />
          Featured (shown first on the website)
        </label>
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteR}
        onOpenChange={(o) => !o && setDeleteR(null)}
        title='Delete review?'
        desc={<span>Remove this review permanently.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
