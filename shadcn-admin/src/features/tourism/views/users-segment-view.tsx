import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { AdminStatusSelect } from '@/components/shared/admin-status-select'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { USER_STATUSES } from '../lib/status-options'
import { useUsersApiQuery } from '../hooks/use-tourism-queries'

type ApiUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  createdAt: string
}

const roleOptions = [
  'customer',
  'tour_guide',
  'guide',
  'staff',
  'cashier',
  'manager',
  'admin',
  'superadmin',
] as const

const statusOptions = USER_STATUSES

export function TourismUsersSegmentPage({
  segment,
  title,
  description,
}: {
  segment: 'customer' | 'staff' | 'guide'
  title: string
  description: string
}) {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useUsersApiQuery()

  const [viewU, setViewU] = useState<ApiUser | null>(null)
  const [editU, setEditU] = useState<ApiUser | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteU, setDeleteU] = useState<ApiUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/users/${id}`, { status })
    },
    onSuccess: async () => {
      toast.success('User status updated — user notified by email')
      await qc.invalidateQueries({ queryKey: ['users'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const rows = useMemo(() => {
    const list = data as ApiUser[]
    if (segment === 'customer')
      return list.filter((u) => u.role === 'customer')
    if (segment === 'staff')
      return list.filter((u) =>
        ['admin', 'superadmin', 'staff', 'cashier', 'manager'].includes(u.role),
      )
    return list.filter(
      (u) => u.role === 'tour_guide' || u.role === 'guide',
    )
  }, [data, segment])

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editU) return
    setEditSaving(true)
    try {
      await api.patch(`/api/users/${editU.id}`, {
        firstName: editU.firstName,
        lastName: editU.lastName,
        email: editU.email,
        phone: editU.phone,
        role: editU.role,
        status: editU.status,
      })
      toast.success('User saved')
      setEditU(null)
      await qc.invalidateQueries({ queryKey: ['users'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteU) return
    setDeleting(true)
    try {
      await api.delete(`/api/users/${deleteU.id}`)
      toast.success('User deleted')
      setDeleteU(null)
      await qc.invalidateQueries({ queryKey: ['users'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title={title}
      description={description}
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Filtered from `/api/users` by role. Full list: <strong>All Users</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <AdminStatusSelect
                        value={u.status}
                        options={statusOptions}
                        disabled={updateStatus.isPending}
                        onChange={(status) =>
                          updateStatus.mutate({ id: u.id, status })
                        }
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={`${u.firstName} ${u.lastName}`.trim() || u.email}
                        onView={() => setViewU(u)}
                        onEdit={() => setEditU({ ...u })}
                        onDelete={() => setDeleteU(u)}
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
        open={!!viewU}
        onOpenChange={(o) => !o && setViewU(null)}
        title={viewU ? `${viewU.firstName} ${viewU.lastName}`.trim() : 'User'}
        description={viewU?.email}
        onEdit={viewU ? () => setEditU({ ...viewU }) : undefined}
      >
        {viewU ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Phone:</span> {viewU.phone || '—'}
            </p>
            <p>
              <span className='text-muted-foreground'>Role:</span> {viewU.role}
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span> {viewU.status}
            </p>
            <p className='text-muted-foreground text-xs'>
              Joined {new Date(viewU.createdAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editU}
        onOpenChange={(o) => !o && setEditU(null)}
        title='Edit user'
        itemName={editU ? `${editU.firstName} ${editU.lastName}`.trim() || editU.email : undefined}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editU ? (
          <>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='ufn'>First name</Label>
                  <Input
                    id='ufn'
                    value={editU.firstName}
                    onChange={(e) => setEditU({ ...editU, firstName: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='uln'>Last name</Label>
                  <Input
                    id='uln'
                    value={editU.lastName}
                    onChange={(e) => setEditU({ ...editU, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='uem'>Email</Label>
                <Input
                  id='uem'
                  type='email'
                  value={editU.email}
                  onChange={(e) => setEditU({ ...editU, email: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='uph'>Phone</Label>
                <Input
                  id='uph'
                  value={editU.phone}
                  onChange={(e) => setEditU({ ...editU, phone: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='uro'>Role</Label>
                <select
                  id='uro'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editU.role}
                  onChange={(e) => setEditU({ ...editU, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  {!roleOptions.includes(editU.role as (typeof roleOptions)[number]) ? (
                    <option value={editU.role}>{editU.role}</option>
                  ) : null}
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ust'>Status</Label>
                <select
                  id='ust'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editU.status}
                  onChange={(e) => setEditU({ ...editU, status: e.target.value })}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!statusOptions.includes(editU.status as (typeof statusOptions)[number]) ? (
                    <option value={editU.status}>{editU.status}</option>
                  ) : null}
                </select>
              </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteU}
        onOpenChange={(o) => !o && setDeleteU(null)}
        title='Delete user?'
        desc={
          <span>
            Permanently remove {deleteU ? `${deleteU.firstName} ${deleteU.lastName}`.trim() : ''} (
            {deleteU?.email})?
          </span>
        }
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
