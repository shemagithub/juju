import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useCarRentalVehicleCategoriesQuery } from '../hooks/use-tourism-queries'

type FleetCategory = {
  id: string
  name: string
  slug: string
  sortOrder: number
  active: boolean
  vehicleCount: number
}

export function TourismCarRentalCategoriesPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch, isFetching } = useCarRentalVehicleCategoriesQuery()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [pending, setPending] = useState(false)

  const [viewCat, setViewCat] = useState<FleetCategory | null>(null)
  const [editCat, setEditCat] = useState<FleetCategory | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteCat, setDeleteCat] = useState<FleetCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const rows = data as FleetCategory[]

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['car-rental-vehicle-categories'] })
    await qc.invalidateQueries({ queryKey: ['car-rental-vehicles'] })
    await qc.invalidateQueries({ queryKey: ['bootstrap'] })
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setPending(true)
    try {
      await api.post('/api/car-rental-vehicle-categories', {
        name: name.trim(),
        slug: slug.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        active: true,
      })
      toast.success('Category added')
      setName('')
      setSlug('')
      setSortOrder('0')
      await invalidate()
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCat?.name.trim()) return
    setEditSaving(true)
    try {
      await api.patch(`/api/car-rental-vehicle-categories/${editCat.id}`, {
        name: editCat.name.trim(),
        sortOrder: editCat.sortOrder,
        active: editCat.active,
      })
      toast.success('Category updated')
      setEditCat(null)
      await invalidate()
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteCat) return
    setDeleting(true)
    try {
      await api.delete(`/api/car-rental-vehicle-categories/${deleteCat.id}`)
      toast.success('Category deleted')
      setDeleteCat(null)
      await invalidate()
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title='Fleet categories'
      description='Manage vehicle categories shown on the public Car Rental filters and in the admin vehicle form.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className={`me-1 size-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/car-rental/vehicles'>All vehicles</Link>
          </Button>
        </div>
      }
    >
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>
            Slug is stored on each vehicle and used in public filters (e.g. economy, suv, safari).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className='flex flex-wrap items-end gap-3'>
            <div className='space-y-2'>
              <Label htmlFor='fc-name'>Name</Label>
              <Input
                id='fc-name'
                placeholder='Safari 4×4'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='min-w-[180px]'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='fc-slug'>Slug (optional)</Label>
              <Input
                id='fc-slug'
                placeholder='safari'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className='min-w-[140px] font-mono text-sm'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='fc-sort'>Sort order</Label>
              <Input
                id='fc-sort'
                type='number'
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className='w-24'
              />
            </div>
            <Button type='submit' disabled={pending}>
              {pending ? 'Adding…' : 'Add category'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Categories with assigned vehicles cannot be deleted until vehicles are reassigned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : rows.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No categories yet — add one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className='font-medium'>{c.name}</TableCell>
                    <TableCell className='font-mono text-xs text-muted-foreground'>{c.slug}</TableCell>
                    <TableCell>{c.sortOrder}</TableCell>
                    <TableCell>{c.vehicleCount}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'default' : 'secondary'}>
                        {c.active ? 'Active' : 'Hidden'}
                      </Badge>
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
        description='Fleet category'
        onEdit={viewCat ? () => setEditCat({ ...viewCat }) : undefined}
      >
        {viewCat ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Slug:</span>{' '}
              <span className='font-mono'>{viewCat.slug}</span>
            </p>
            <p>
              <span className='text-muted-foreground'>Sort order:</span> {viewCat.sortOrder}
            </p>
            <p>
              <span className='text-muted-foreground'>Vehicles:</span> {viewCat.vehicleCount}
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span>{' '}
              {viewCat.active ? 'Active (public filters)' : 'Hidden'}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editCat}
        onOpenChange={(o) => !o && setEditCat(null)}
        title='Edit category'
        itemName={editCat?.name}
        onSubmit={saveCategory}
        saving={editSaving}
      >
        {editCat ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-fc-name'>Name</Label>
              <Input
                id='edit-fc-name'
                value={editCat.name}
                onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-fc-sort'>Sort order</Label>
              <Input
                id='edit-fc-sort'
                type='number'
                value={editCat.sortOrder}
                onChange={(e) =>
                  setEditCat({ ...editCat, sortOrder: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='edit-fc-active'
                checked={editCat.active}
                onCheckedChange={(checked) =>
                  setEditCat({ ...editCat, active: checked === true })
                }
              />
              <Label htmlFor='edit-fc-active' className='font-normal'>
                Active on public site
              </Label>
            </div>
            <p className='text-muted-foreground text-xs'>
              Slug <span className='font-mono'>{editCat.slug}</span> cannot be changed while
              vehicles are assigned.
            </p>
          </div>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => !o && setDeleteCat(null)}
        title='Delete category?'
        desc={
          deleteCat ? (
            <span>
              Remove “{deleteCat.name}” ({deleteCat.slug})?
              {deleteCat.vehicleCount > 0 ? (
                <>
                  {' '}
                  <strong>{deleteCat.vehicleCount} vehicle(s)</strong> still use this category —
                  reassign them first.
                </>
              ) : null}
            </span>
          ) : (
            ''
          )
        }
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
