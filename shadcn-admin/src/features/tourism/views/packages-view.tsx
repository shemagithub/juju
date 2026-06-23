import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Tags } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ImagesUploader } from '@/components/shared/image-uploader'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { PACKAGE_STATUSES } from '../lib/status-options'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import {
  useDestinationsQuery,
  usePackageCategoriesQuery,
  useTourPackagesQuery,
} from '../hooks/use-tourism-queries'

type Pkg = {
  id: string
  title: string
  slug: string
  durationDays: number
  description: string
  status: string
  itinerary: { day: number; title: string; description: string }[]
  imageUrls?: string[]
  categoryId?: string
  destinationIds?: string[]
}

type Cat = { id: string; name: string; slug: string; packageCount?: number }

export function TourismPackagesPage({
  variant,
}: {
  variant: 'list' | 'new' | 'categories' | 'itineraries'
}) {
  if (variant === 'new') return <PackageNewPage />
  if (variant === 'categories') return <PackageCategoriesPage />
  if (variant === 'itineraries') return <PackageItinerariesPage />
  return <PackageListPage />
}

function PackageListPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useTourPackagesQuery()
  const { data: categories = [] } = usePackageCategoriesQuery()
  const { data: destinations = [] } = useDestinationsQuery()

  const [viewPkg, setViewPkg] = useState<Pkg | null>(null)
  const [editPkg, setEditPkg] = useState<Pkg | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletePkg, setDeletePkg] = useState<Pkg | null>(null)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/tour-packages/${id}`, { status })
    },
    onSuccess: async () => {
      toast.success('Package status updated')
      await qc.invalidateQueries({ queryKey: ['tour-packages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPkg) return
    if (!(editPkg.imageUrls?.length ?? 0))
      return toast.error('Add at least 1 image')
    setEditSaving(true)
    try {
      await api.patch(`/api/tour-packages/${editPkg.id}`, {
        title: editPkg.title,
        slug: editPkg.slug,
        durationDays: editPkg.durationDays,
        description: editPkg.description,
        status: editPkg.status,
        categoryId: editPkg.categoryId || undefined,
        imageUrls: editPkg.imageUrls ?? [],
        destinationIds: editPkg.destinationIds ?? [],
      })
      toast.success('Package updated')
      setEditPkg(null)
      await qc.invalidateQueries({ queryKey: ['tour-packages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deletePkg) return
    setDeleting(true)
    try {
      await api.delete(`/api/tour-packages/${deletePkg.id}`)
      toast.success('Package deleted')
      setDeletePkg(null)
      await qc.invalidateQueries({ queryKey: ['tour-packages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title='Tour packages'
      description='Manage safari and tour products. Changes sync to your public site when wired.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/tour-packages/categories'>
              <Tags className='me-1 size-4' />
              Categories
            </Link>
          </Button>
          <Button size='sm' asChild>
            <Link to='/tour-packages/new'>
              <Plus className='me-1 size-4' />
              Add package
            </Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>All packages</CardTitle>
          <CardDescription>
            Duration in days, category, and itinerary stored per package.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as Pkg[]).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='font-medium'>{p.title}</TableCell>
                    <TableCell>{p.durationDays}</TableCell>
                    <TableCell>
                      <AdminStatusSelect
                        value={p.status}
                        options={PACKAGE_STATUSES}
                        disabled={updateStatus.isPending}
                        onChange={(status) =>
                          updateStatus.mutate({ id: p.id, status })
                        }
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={p.title}
                        onView={() => setViewPkg(p)}
                        onEdit={() => setEditPkg({ ...p, imageUrls: p.imageUrls ?? [] })}
                        onDelete={() => setDeletePkg(p)}
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
        open={!!viewPkg}
        onOpenChange={(o) => !o && setViewPkg(null)}
        title={viewPkg?.title ?? 'Package'}
        description={viewPkg?.slug}
        size='2xl'
        onEdit={
          viewPkg
            ? () => setEditPkg({ ...viewPkg, imageUrls: viewPkg.imageUrls ?? [] })
            : undefined
        }
      >
        {viewPkg ? (
          <div className='space-y-3 text-sm'>
            <p>
              <span className='text-muted-foreground'>Duration:</span>{' '}
              {viewPkg.durationDays} day(s)
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span> {viewPkg.status}
            </p>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Description</p>
              <p className='mt-1 whitespace-pre-wrap'>{viewPkg.description || '—'}</p>
            </div>
            <p className='text-muted-foreground text-xs'>ID: {viewPkg.id}</p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editPkg}
        onOpenChange={(o) => !o && setEditPkg(null)}
        title='Edit package'
        itemName={editPkg?.title}
        onSubmit={saveEdit}
        saving={editSaving}
        size='xl'
      >
        {editPkg ? (
          <>
              <div className='space-y-2'>
                <Label htmlFor='pt'>Title</Label>
                <Input
                  id='pt'
                  value={editPkg.title}
                  onChange={(e) => setEditPkg({ ...editPkg, title: e.target.value })}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ps'>Slug</Label>
                <Input
                  id='ps'
                  value={editPkg.slug}
                  onChange={(e) => setEditPkg({ ...editPkg, slug: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pd'>Duration (days)</Label>
                <Input
                  id='pd'
                  type='number'
                  min={1}
                  value={editPkg.durationDays}
                  onChange={(e) =>
                    setEditPkg({ ...editPkg, durationDays: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pst'>Status</Label>
                <select
                  id='pst'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editPkg.status}
                  onChange={(e) => setEditPkg({ ...editPkg, status: e.target.value })}
                >
                  <option value='active'>active</option>
                  <option value='inactive'>inactive</option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pcat'>Category</Label>
                <select
                  id='pcat'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editPkg.categoryId ?? ''}
                  onChange={(e) => setEditPkg({ ...editPkg, categoryId: e.target.value })}
                >
                  <option value=''>— None —</option>
                  {(categories as Cat[]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='space-y-2'>
                <Label>Linked destinations</Label>
                <div className='bg-muted/40 max-h-36 space-y-2 overflow-y-auto rounded-md border p-2'>
                  {(destinations as { id: string; name: string }[]).map((d) => (
                    <label key={d.id} className='flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={(editPkg.destinationIds ?? []).includes(d.id)}
                        onChange={(e) => {
                          const set = new Set(editPkg.destinationIds ?? [])
                          if (e.target.checked) set.add(d.id)
                          else set.delete(d.id)
                          setEditPkg({
                            ...editPkg,
                            destinationIds: [...set],
                          })
                        }}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pdesc'>Description</Label>
                <Textarea
                  id='pdesc'
                  value={editPkg.description}
                  onChange={(e) => setEditPkg({ ...editPkg, description: e.target.value })}
                  rows={4}
                />
              </div>
              <ImagesUploader
                label='Package images'
                value={editPkg.imageUrls ?? []}
                onChange={(urls) => setEditPkg({ ...editPkg, imageUrls: urls })}
                required
              />
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deletePkg}
        onOpenChange={(o) => !o && setDeletePkg(null)}
        title='Delete tour package?'
        desc={<span>This removes the package and its itinerary links.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}

function PackageNewPage() {
  const qc = useQueryClient()
  const { data: categories = [] } = usePackageCategoriesQuery()
  const [title, setTitle] = useState('')
  const [durationDays, setDurationDays] = useState('3')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrls.length) return toast.error('Add at least 1 image')
    setPending(true)
    try {
      await api.post('/api/tour-packages', {
        title,
        durationDays: Number(durationDays) || 1,
        description,
        categoryId: categoryId || undefined,
        imageUrls,
        itinerary: [
          {
            day: 1,
            title: 'Arrival',
            description: 'Welcome and briefing.',
          },
        ],
        destinationIds: [],
        status: 'active',
      })
      toast.success('Package created')
      await qc.invalidateQueries({ queryKey: ['tour-packages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      setTitle('')
      setDescription('')
      setImageUrls([])
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='Add package'
      description='Create a new bookable tour. Add detailed itinerary from the package editor later if needed.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/tour-packages'>Back to list</Link>
        </Button>
      }
    >
      <Card className='max-w-xl'>
        <CardHeader>
          <CardTitle>New package</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='days'>Duration (days)</Label>
              <Input
                id='days'
                type='number'
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cat'>Category</Label>
              <select
                id='cat'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value=''>— None —</option>
                {(categories as Cat[]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='desc'>Description</Label>
              <Textarea
                id='desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <ImagesUploader
              label='Package images'
              value={imageUrls}
              onChange={setImageUrls}
              required
            />
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : 'Create package'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}

function PackageCategoriesPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = usePackageCategoriesQuery()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [pending, setPending] = useState(false)
  const [viewCat, setViewCat] = useState<Cat | null>(null)
  const [editCat, setEditCat] = useState<Cat | null>(null)
  const [editCatSaving, setEditCatSaving] = useState(false)
  const [deleteCat, setDeleteCat] = useState<Cat | null>(null)
  const [deletingCat, setDeletingCat] = useState(false)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setPending(true)
    try {
      await api.post('/api/package-categories', {
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      toast.success('Category added')
      setName('')
      setSlug('')
      await qc.invalidateQueries({ queryKey: ['package-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCat?.name.trim()) return
    setEditCatSaving(true)
    try {
      await api.patch(`/api/package-categories/${editCat.id}`, {
        name: editCat.name.trim(),
        slug: editCat.slug?.trim() || undefined,
      })
      toast.success('Category updated')
      setEditCat(null)
      await qc.invalidateQueries({ queryKey: ['package-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditCatSaving(false)
    }
  }

  const doDeleteCategory = async () => {
    if (!deleteCat) return
    setDeletingCat(true)
    try {
      await api.delete(`/api/package-categories/${deleteCat.id}`)
      toast.success('Category deleted')
      setDeleteCat(null)
      await qc.invalidateQueries({ queryKey: ['package-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeletingCat(false)
    }
  }

  return (
    <TourismAdminShell
      title='Package categories'
      description='Group packages for browsing on the website.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link to='/tour-packages'>All packages</Link>
          </Button>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
        </div>
      }
    >
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>
            Categories appear as filters on the public packages page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className='flex flex-wrap items-end gap-2'>
            <div className='space-y-1'>
              <Label htmlFor='pc-name'>Name</Label>
              <Input
                id='pc-name'
                placeholder='Safari'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-48'
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='pc-slug'>Slug (optional)</Label>
              <Input
                id='pc-slug'
                placeholder='safari'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className='w-40'
              />
            </div>
            <Button type='submit' disabled={pending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='pt-6'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as Cat[]).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className='text-muted-foreground'>{c.slug}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{c.packageCount ?? 0}</Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={c.name}
                        onView={() => setViewCat(c)}
                        onEdit={() => setEditCat({ ...c })}
                        onDelete={() => setDeleteCat(c)}
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
        open={!!viewCat}
        onOpenChange={(o) => !o && setViewCat(null)}
        title={viewCat?.name ?? 'Category'}
        description='Package category'
        onEdit={viewCat ? () => setEditCat({ ...viewCat }) : undefined}
      >
        {viewCat ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Slug:</span> {viewCat.slug}
            </p>
            <p>
              <span className='text-muted-foreground'>Packages:</span>{' '}
              {viewCat.packageCount ?? 0}
            </p>
            <p className='font-mono text-xs'>{viewCat.id}</p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editCat}
        onOpenChange={(o) => !o && setEditCat(null)}
        title='Edit category'
        itemName={editCat?.name}
        onSubmit={saveCategory}
        saving={editCatSaving}
      >
        {editCat ? (
          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label htmlFor='pcn'>Name</Label>
              <Input
                id='pcn'
                value={editCat.name}
                onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pcs'>Slug</Label>
              <Input
                id='pcs'
                value={editCat.slug}
                onChange={(e) => setEditCat({ ...editCat, slug: e.target.value })}
                required
              />
            </div>
          </div>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title='Delete category?'
        desc={
          <span>
            Remove {deleteCat?.name}?
            {(deleteCat?.packageCount ?? 0) > 0
              ? ` ${deleteCat?.packageCount} package(s) still use this category — reassign them first.`
              : ' This cannot be undone.'}
          </span>
        }
        destructive
        isLoading={deletingCat}
        confirmText={deletingCat ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDeleteCategory()}
      />
    </TourismAdminShell>
  )
}

function PackageItinerariesPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useTourPackagesQuery()
  const [viewPkg, setViewPkg] = useState<Pkg | null>(null)
  const [editPkg, setEditPkg] = useState<Pkg | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const saveItinerary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPkg) return
    setEditSaving(true)
    try {
      await api.patch(`/api/tour-packages/${editPkg.id}`, {
        itinerary: editPkg.itinerary ?? [],
      })
      toast.success('Itinerary updated')
      setEditPkg(null)
      await qc.invalidateQueries({ queryKey: ['tour-packages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const updateDay = (
    dayIndex: number,
    field: 'day' | 'title' | 'description',
    value: string | number,
  ) => {
    if (!editPkg) return
    const next = [...(editPkg.itinerary ?? [])]
    next[dayIndex] = { ...next[dayIndex], [field]: value }
    setEditPkg({ ...editPkg, itinerary: next })
  }

  const addDay = () => {
    if (!editPkg) return
    const days = editPkg.itinerary ?? []
    const nextDay = days.length ? Math.max(...days.map((d) => d.day)) + 1 : 1
    setEditPkg({
      ...editPkg,
      itinerary: [...days, { day: nextDay, title: '', description: '' }],
    })
  }

  const removeDay = (dayIndex: number) => {
    if (!editPkg) return
    setEditPkg({
      ...editPkg,
      itinerary: (editPkg.itinerary ?? []).filter((_, i) => i !== dayIndex),
    })
  }

  return (
    <TourismAdminShell
      title='Itineraries'
      description='Day-by-day plans attached to each package.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardContent className='pt-6'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <div className='space-y-6'>
              {(data as Pkg[]).map((p) => (
                <div key={p.id} className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-start justify-between gap-2'>
                    <h3 className='font-semibold'>{p.title}</h3>
                    <ResourceRowActions
                      onView={() => setViewPkg(p)}
                      onEdit={() => setEditPkg({ ...p, itinerary: [...(p.itinerary ?? [])] })}
                    />
                  </div>
                  <ul className='text-muted-foreground list-inside list-decimal space-y-1 text-sm'>
                    {(p.itinerary ?? []).length === 0 ? (
                      <li className='list-none'>No itinerary days yet.</li>
                    ) : (
                      (p.itinerary ?? []).map((d) => (
                        <li key={d.day}>
                          <span className='text-foreground font-medium'>
                            Day {d.day}: {d.title}
                          </span>{' '}
                          — {d.description}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewPkg}
        onOpenChange={(o) => !o && setViewPkg(null)}
        title={viewPkg?.title ?? 'Itinerary'}
        description='Package itinerary'
        size='2xl'
        onEdit={viewPkg ? () => setEditPkg({ ...viewPkg }) : undefined}
      >
        {viewPkg ? (
          <ol className='list-decimal space-y-3 ps-4 text-sm'>
            {(viewPkg.itinerary ?? []).map((d) => (
              <li key={d.day}>
                <p className='font-medium'>
                  Day {d.day}: {d.title}
                </p>
                <p className='text-muted-foreground mt-1 whitespace-pre-wrap'>{d.description}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editPkg}
        onOpenChange={(o) => !o && setEditPkg(null)}
        title='Edit itinerary'
        itemName={editPkg?.title}
        onSubmit={saveItinerary}
        saving={editSaving}
        saveLabel='Save itinerary'
        size='2xl'
      >
        {editPkg ? (
          <>
            {(editPkg.itinerary ?? []).map((d, idx) => (
              <div key={idx} className='space-y-2 rounded-md border p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <Label>Day {d.day}</Label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-destructive'
                    onClick={() => removeDay(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder='Title'
                  value={d.title}
                  onChange={(e) => updateDay(idx, 'title', e.target.value)}
                />
                <Textarea
                  placeholder='Description'
                  value={d.description}
                  onChange={(e) => updateDay(idx, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={addDay}>
              Add day
            </Button>
          </>
        ) : null}
      </ResourceEditDialog>
    </TourismAdminShell>
  )
}
