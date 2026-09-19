import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plus, RefreshCw } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { resolveAssetUrl } from '@/lib/asset-url'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { DestinationDetailForm } from '../components/destination-detail-form'
import {
  emptyDestinationForm,
  sanitizeDestinationPayload,
  type DestinationFormValue,
} from '../components/destination-detail-form.shared'
import { useDestinationsQuery, useTourPackagesQuery } from '../hooks/use-tourism-queries'

type Dest = DestinationFormValue & { id: string }

function toFormValue(d: Dest): DestinationFormValue {
  return {
    name: d.name ?? '',
    slug: d.slug ?? '',
    description: d.description ?? '',
    imageUrls: d.imageUrls ?? [],
    lat: Number(d.lat ?? 0),
    lng: Number(d.lng ?? 0),
    category: d.category ?? 'parks',
    location: d.location ?? '',
    distance: d.distance ?? '',
    permitRequired: !!d.permitRequired,
    permitPrice: Number(d.permitPrice ?? 0),
    highlights: d.highlights?.length ? d.highlights : [''],
    activities: d.activities?.length ? d.activities : [],
    bestTime: d.bestTime ?? '',
    weather: d.weather ?? '',
    reviews: d.reviews?.length ? d.reviews : [],
    faqs: d.faqs?.length ? d.faqs : emptyDestinationForm().faqs,
    linkedPackageIds: d.linkedPackageIds ?? [],
  }
}

export function TourismDestinationsPage({ variant }: { variant: 'list' | 'new' }) {
  if (variant === 'new') return <DestinationNewPage />
  return <DestinationListPage />
}

function DestinationListPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useDestinationsQuery()
  const { data: packages = [] } = useTourPackagesQuery()

  const [viewDest, setViewDest] = useState<Dest | null>(null)
  const [editDest, setEditDest] = useState<DestinationFormValue | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteDest, setDeleteDest] = useState<Dest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pkgTitle = (id: string) =>
    (packages as { id: string; title: string }[]).find((p) => p.id === id)?.title ?? id.slice(0, 8)

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDest || !editId) return
    if (!(editDest.imageUrls?.length ?? 0)) return toast.error('Add at least 1 image')
    setEditSaving(true)
    try {
      await api.patch(`/api/destinations/${editId}`, sanitizeDestinationPayload(editDest))
      toast.success('Destination updated')
      setEditDest(null)
      setEditId(null)
      await qc.invalidateQueries({ queryKey: ['destinations'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteDest) return
    setDeleting(true)
    try {
      await api.delete(`/api/destinations/${deleteDest.id}`)
      toast.success('Destination deleted')
      setDeleteDest(null)
      await qc.invalidateQueries({ queryKey: ['destinations'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title='Destinations'
      description='Places you sell trips to. Open one to edit the travel guide.'
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
          <Button size='sm' asChild>
            <Link to='/destinations/new'>
              <Plus className='me-1 size-4' />
              Add destination
            </Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>All destinations</CardTitle>
          <CardDescription>Edits sync to the public Destinations page modal.</CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Permit</TableHead>
                  <TableHead>Linked packages</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as Dest[]).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium'>{d.name}</TableCell>
                    <TableCell className='text-muted-foreground text-sm capitalize'>
                      {d.category ?? 'parks'}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {d.location || '—'}
                    </TableCell>
                    <TableCell>
                      {d.permitRequired ? (
                        <Badge>${d.permitPrice}</Badge>
                      ) : (
                        <span className='text-muted-foreground text-sm'>No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {(d.linkedPackageIds ?? []).length} packages
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={d.name}
                        onView={() => setViewDest(d)}
                        onEdit={() => {
                          setEditId(d.id)
                          setEditDest(toFormValue(d))
                        }}
                        onDelete={() => setDeleteDest(d)}
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
        open={!!viewDest}
        onOpenChange={(o) => !o && setViewDest(null)}
        title={viewDest?.name ?? 'Destination'}
        description={viewDest?.location}
        onEdit={
          viewDest
            ? () => {
                setEditId(viewDest.id)
                setEditDest(toFormValue(viewDest))
              }
            : undefined
        }
      >
        {viewDest ? (
          <div className='space-y-3 text-sm'>
            {viewDest.imageUrls?.[0] ? (
              <img
                src={resolveAssetUrl(viewDest.imageUrls[0])}
                alt=''
                className='h-40 w-full rounded-md border object-cover'
              />
            ) : null}
            <p className='whitespace-pre-wrap'>{viewDest.description || '—'}</p>
            <p className='text-muted-foreground text-xs'>
              {viewDest.distance} · Best: {viewDest.bestTime || '—'}
            </p>
            <p className='text-muted-foreground text-xs'>
              Highlights: {(viewDest.highlights ?? []).join(', ') || '—'}
            </p>
            <p className='text-muted-foreground text-xs'>
              Linked: {(viewDest.linkedPackageIds ?? []).map(pkgTitle).join(', ') || '—'}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editDest}
        onOpenChange={(o) => !o && (setEditDest(null), setEditId(null))}
        title='Edit destination'
        description='This is what visitors read when they open this place.'
        itemName={editDest?.name}
        onSubmit={saveEdit}
        saving={editSaving}
        saveLabel='Save destination'
        size='2xl'
      >
        {editDest ? (
          <DestinationDetailForm
            value={editDest}
            onChange={setEditDest}
            packages={packages as { id: string; title: string }[]}
          />
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteDest}
        onOpenChange={(o) => !o && setDeleteDest(null)}
        title='Delete destination?'
        desc={<span>This removes {deleteDest?.name} and its package links.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}

function DestinationNewPage() {
  const qc = useQueryClient()
  const { data: packages = [] } = useTourPackagesQuery()
  const [form, setForm] = useState<DestinationFormValue>(emptyDestinationForm())
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.imageUrls.length) return toast.error('Add at least 1 image')
    setPending(true)
    try {
      await api.post('/api/destinations', sanitizeDestinationPayload(form))
      toast.success('Destination created')
      await qc.invalidateQueries({ queryKey: ['destinations'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      setForm(emptyDestinationForm())
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='Add destination'
      description='Add a place. Visitors will see it in the travel guide.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/destinations'>Back to list</Link>
        </Button>
      }
    >
      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>New destination</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className='space-y-4'>
            <DestinationDetailForm
              value={form}
              onChange={setForm}
              packages={packages as { id: string; title: string }[]}
            />
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : 'Save destination'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}
