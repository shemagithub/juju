import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { useBootstrapQuery } from '@/hooks/use-bootstrap-query'
import { TourismAdminShell } from '../components/tourism-admin-shell'

type Notification = {
  id: string
  type: string
  title: string
  read: boolean
  createdAt: string
}

export function TourismExtrasPage() {
  const { data: boot, refetch, isPending } = useBootstrapQuery()
  const [viewNote, setViewNote] = useState<Notification | null>(null)

  const notes = boot?.notifications as Notification[] | undefined

  return (
    <TourismAdminShell
      title='Notifications'
      description='Admin alerts (system, payments, inquiries).'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardContent className='space-y-3 pt-6'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (notes ?? []).length === 0 ? (
            <p className='text-muted-foreground text-sm'>No notifications.</p>
          ) : (
            (notes ?? []).map((n) => (
              <div
                key={n.id}
                className='bg-muted/40 flex items-start justify-between gap-2 rounded-md border px-3 py-2'
              >
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-medium'>{n.title}</p>
                    {!n.read ? <Badge variant='outline'>new</Badge> : null}
                  </div>
                  <p className='text-muted-foreground text-xs'>{n.type}</p>
                  <span className='text-muted-foreground text-xs'>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <ResourceRowActions onView={() => setViewNote(n)} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewNote} onOpenChange={(o) => !o && setViewNote(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{viewNote?.title}</DialogTitle>
            <DialogDescription className='font-mono text-xs'>{viewNote?.id}</DialogDescription>
          </DialogHeader>
          {viewNote ? (
            <div className='space-y-2 text-sm'>
              <p>
                <span className='text-muted-foreground'>Type:</span> {viewNote.type}
              </p>
              <p>
                <span className='text-muted-foreground'>Read:</span>{' '}
                {viewNote.read ? 'Yes' : 'No'}
              </p>
              <p>
                <span className='text-muted-foreground'>Created:</span>{' '}
                {new Date(viewNote.createdAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </TourismAdminShell>
  )
}
