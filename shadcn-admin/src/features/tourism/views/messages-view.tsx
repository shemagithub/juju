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
import { useMessagesQuery } from '../hooks/use-tourism-queries'

type Msg = {
  id: string
  source: string
  name: string
  email: string
  subject: string
  body: string
  read: boolean
  createdAt: string
}

export function TourismMessagesPage({
  channel,
}: {
  channel: 'inquiries' | 'contact' | 'all'
}) {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useMessagesQuery()

  const [viewM, setViewM] = useState<Msg | null>(null)
  const [editM, setEditM] = useState<Msg | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteM, setDeleteM] = useState<Msg | null>(null)
  const [deleting, setDeleting] = useState(false)

  const rows = useMemo(() => {
    const list = data as Msg[]
    if (channel === 'all') return list
    const q = channel === 'inquiries' ? 'inquir' : 'contact'
    return list.filter((m) => m.source?.toLowerCase().includes(q))
  }, [data, channel])

  const mark = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      await api.patch(`/api/messages/${id}`, { read })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      toast.success('Updated')
    },
    onError: handleServerError,
  })

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editM) return
    setEditSaving(true)
    try {
      await api.patch(`/api/messages/${editM.id}`, {
        subject: editM.subject,
        body: editM.body,
        read: editM.read,
      })
      toast.success('Message saved')
      setEditM(null)
      await qc.invalidateQueries({ queryKey: ['messages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteM) return
    setDeleting(true)
    try {
      await api.delete(`/api/messages/${deleteM.id}`)
      toast.success('Message deleted')
      setDeleteM(null)
      await qc.invalidateQueries({ queryKey: ['messages'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  const title =
    channel === 'inquiries'
      ? 'Inquiries'
      : channel === 'contact'
        ? 'Contact messages'
        : 'All messages'

  return (
    <TourismAdminShell
      title={title}
      description='Messages from contact forms. View, edit notes, or remove threads.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Read state syncs to the database. Name and email are from the original submission.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className='max-w-[200px] truncate font-medium'>
                      {m.subject}
                    </TableCell>
                    <TableCell className='max-w-[160px] truncate text-sm'>
                      {m.name}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs'>{m.source}</TableCell>
                    <TableCell>
                      <Badge variant={m.read ? 'secondary' : 'default'}>
                        {m.read ? 'Read' : 'New'}
                      </Badge>
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                      {new Date(m.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={m.subject || m.name}
                        onView={() => setViewM(m)}
                        onEdit={() => setEditM({ ...m })}
                        onDelete={() => setDeleteM(m)}
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
        open={!!viewM}
        onOpenChange={(o) => !o && setViewM(null)}
        title={viewM?.subject ?? 'Message'}
        description={viewM ? `${viewM.name} <${viewM.email}>` : undefined}
        onEdit={viewM ? () => setEditM({ ...viewM }) : undefined}
      >
        {viewM ? (
          <div className='space-y-3 text-sm'>
            <p>
              <span className='text-muted-foreground'>Source:</span> {viewM.source}
            </p>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Body</p>
              <p className='mt-1 whitespace-pre-wrap'>{viewM.body}</p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={viewM.read ? 'secondary' : 'default'}>
                {viewM.read ? 'Read' : 'Unread'}
              </Badge>
              <span className='text-muted-foreground text-xs'>
                {new Date(viewM.createdAt).toLocaleString()}
              </span>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => mark.mutate({ id: viewM.id, read: !viewM.read })}
            >
              Mark as {viewM.read ? 'unread' : 'read'}
            </Button>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editM}
        onOpenChange={(o) => !o && setEditM(null)}
        title='Edit message'
        description='Subject and body can be adjusted for internal notes; sender fields are read-only here.'
        itemName={editM?.subject || editM?.name}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editM ? (
          <>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground text-xs'>From (read-only)</p>
              <p className='mt-1'>
                {editM.name} &lt;{editM.email}&gt;
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='msub'>Subject</Label>
              <Input
                id='msub'
                value={editM.subject}
                onChange={(e) => setEditM({ ...editM, subject: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='mbody'>Body</Label>
              <Textarea
                id='mbody'
                value={editM.body}
                onChange={(e) => setEditM({ ...editM, body: e.target.value })}
                rows={6}
              />
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={editM.read}
                onChange={(e) => setEditM({ ...editM, read: e.target.checked })}
              />
              Mark as read
            </label>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteM}
        onOpenChange={(o) => !o && setDeleteM(null)}
        title='Delete message?'
        desc={<span>Remove this thread from the inbox permanently.</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
