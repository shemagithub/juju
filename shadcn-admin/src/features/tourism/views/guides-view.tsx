import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
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
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useTourGuidesQuery, useUsersApiQuery } from '../hooks/use-tourism-queries'

type Guide = {
  id: string
  userId: string
  languages: string[]
  bio: string
  availability: string
  activeBookingIds: string[]
  updatedAt: string
}

export function TourismGuidesPage({
  variant,
}: {
  variant: 'list' | 'assign' | 'availability'
}) {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useTourGuidesQuery()
  const { data: users = [] } = useUsersApiQuery()

  const [viewG, setViewG] = useState<Guide | null>(null)
  const [editG, setEditG] = useState<Guide | null>(null)
  const [langStr, setLangStr] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteG, setDeleteG] = useState<Guide | null>(null)
  const [deleting, setDeleting] = useState(false)

  const userLabel = (id: string) => {
    const u = (users as { id: string; firstName: string; lastName: string }[]).find(
      (x) => x.id === id,
    )
    return u ? `${u.firstName} ${u.lastName}`.trim() : id.slice(0, 8)
  }

  const openEdit = (g: Guide) => {
    setEditG({ ...g })
    setLangStr((g.languages ?? []).join(', '))
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editG) return
    const languages = langStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setEditSaving(true)
    try {
      await api.patch(`/api/tour-guides/${editG.id}`, {
        userId: editG.userId,
        languages,
        bio: editG.bio,
        availability: editG.availability,
      })
      toast.success('Guide saved')
      setEditG(null)
      await qc.invalidateQueries({ queryKey: ['tour-guides'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteG) return
    setDeleting(true)
    try {
      await api.delete(`/api/tour-guides/${deleteG.id}`)
      toast.success('Guide deleted')
      setDeleteG(null)
      await qc.invalidateQueries({ queryKey: ['tour-guides'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  if (variant === 'assign') {
    return (
      <TourismAdminShell
        title='Assign guides'
        description='Open a booking to pick a guide.'
        actions={
          <Button variant='outline' size='sm' asChild>
            <Link to='/bookings'>Open bookings</Link>
          </Button>
        }
      >
        <Card>
          <CardContent className='text-muted-foreground pt-6 text-sm'>
            Use <strong>All bookings</strong> → Guide column to link a guide to a booking.
          </CardContent>
        </Card>
      </TourismAdminShell>
    )
  }

  return (
    <TourismAdminShell
      title={
        variant === 'availability' ? 'Guide availability' : 'Tour guides'
      }
      description='Edit languages, bio, and when they are free.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Guides</CardTitle>
          <CardDescription>
            Each guide is tied to a user account. Active booking counts update from assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Active bookings</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as Guide[]).map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className='max-w-[180px] truncate text-sm'>
                      {userLabel(g.userId)}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate text-sm'>
                      {(g.languages ?? []).join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{g.availability}</Badge>
                    </TableCell>
                    <TableCell>{g.activeBookingIds?.length ?? 0}</TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={userLabel(g.userId)}
                        onView={() => setViewG(g)}
                        onEdit={() => openEdit(g)}
                        onDelete={() => setDeleteG(g)}
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
        open={!!viewG}
        onOpenChange={(o) => !o && setViewG(null)}
        title='Guide'
        description={viewG ? userLabel(viewG.userId) : undefined}
        onEdit={viewG ? () => openEdit(viewG) : undefined}
      >
        {viewG ? (
          <div className='space-y-3 text-sm'>
            <p>
              <span className='text-muted-foreground'>Languages:</span>{' '}
              {(viewG.languages ?? []).join(', ') || '—'}
            </p>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Bio</p>
              <p className='mt-1 whitespace-pre-wrap'>{viewG.bio || '—'}</p>
            </div>
            <p>
              <span className='text-muted-foreground'>Availability:</span> {viewG.availability}
            </p>
            <p>
              <span className='text-muted-foreground'>Active bookings:</span>{' '}
              {viewG.activeBookingIds?.length ?? 0}
            </p>
            <p className='text-muted-foreground text-xs'>
              Updated {new Date(viewG.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editG}
        onOpenChange={(o) => !o && setEditG(null)}
        title='Edit guide'
        itemName={editG ? userLabel(editG.userId) : undefined}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editG ? (
          <>
            <div className='space-y-2'>
              <Label htmlFor='guser'>User ID</Label>
              <Input
                id='guser'
                value={editG.userId}
                onChange={(e) => setEditG({ ...editG, userId: e.target.value })}
                className='font-mono text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='glang'>Languages (comma-separated)</Label>
              <Input
                id='glang'
                value={langStr}
                onChange={(e) => setLangStr(e.target.value)}
                placeholder='English, French, Kinyarwanda'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='gbio'>Bio</Label>
              <Textarea
                id='gbio'
                value={editG.bio}
                onChange={(e) => setEditG({ ...editG, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='gavail'>Availability</Label>
              <Input
                id='gavail'
                value={editG.availability}
                onChange={(e) => setEditG({ ...editG, availability: e.target.value })}
                placeholder='available, busy, offline…'
              />
            </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteG}
        onOpenChange={(o) => !o && setDeleteG(null)}
        title='Delete guide profile?'
        desc={<span>This removes the guide record; user account is unchanged.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
