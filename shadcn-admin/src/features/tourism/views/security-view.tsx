import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useActivityLogsQuery, useRoleDefinitionsQuery } from '../hooks/use-tourism-queries'

type LogRow = {
  id: string
  actor: string
  action: string
  entity: string
  at: string
}

type RoleRow = { id: string; label: string; permissions: string[] }

export function TourismSecurityPage({
  variant,
}: {
  variant: 'roles' | 'activity'
}) {
  const { data: roles = [], isPending: rPending, refetch: rRefetch } =
    useRoleDefinitionsQuery()
  const { data: logs = [], isPending: lPending, refetch: lRefetch } =
    useActivityLogsQuery()

  const [viewLog, setViewLog] = useState<LogRow | null>(null)
  const [viewRole, setViewRole] = useState<RoleRow | null>(null)

  if (variant === 'activity') {
    return (
      <TourismAdminShell
        title='Activity logs'
        description='Who did what, and when. You can look, not change.'
        actions={
          <Button variant='outline' size='sm' onClick={() => void lRefetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
        }
      >
        <Card>
          <CardContent className='pt-6'>
            {lPending ? (
              <p className='text-muted-foreground text-sm'>Loading…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs as LogRow[]).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className='text-muted-foreground whitespace-nowrap text-xs'>
                        {new Date(log.at).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.actor}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className='max-w-xs truncate'>{log.entity}</TableCell>
                      <TableCell className='text-right'>
                        <ResourceRowActions onView={() => setViewLog(log)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!viewLog} onOpenChange={(o) => !o && setViewLog(null)}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Activity entry</DialogTitle>
              <DialogDescription className='font-mono text-xs'>{viewLog?.id}</DialogDescription>
            </DialogHeader>
            {viewLog ? (
              <div className='space-y-2 text-sm'>
                <p>
                  <span className='text-muted-foreground'>When:</span>{' '}
                  {new Date(viewLog.at).toLocaleString()}
                </p>
                <p>
                  <span className='text-muted-foreground'>Actor:</span> {viewLog.actor}
                </p>
                <p>
                  <span className='text-muted-foreground'>Action:</span> {viewLog.action}
                </p>
                <div className='rounded-md border p-3'>
                  <p className='text-muted-foreground text-xs'>Entity / detail</p>
                  <p className='mt-1 break-all font-mono text-xs'>{viewLog.entity}</p>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </TourismAdminShell>
    )
  }

  return (
    <TourismAdminShell
      title='Roles & permissions'
      description='What each role is allowed to do. You can look, not change.'
      actions={
        <Button variant='outline' size='sm' onClick={() => void rRefetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Permissions for this role.
          </CardDescription>
        </CardHeader>
        <CardContent className='min-w-0'>
          {rPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roles as RoleRow[]).map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>{role.label}</TableCell>
                    <TableCell className='font-mono text-xs'>{role.id}</TableCell>
                    <TableCell>
                      <div className='flex max-w-md flex-wrap gap-1'>
                        {(role.permissions ?? []).slice(0, 6).map((p) => (
                          <Badge key={p} variant='secondary' className='text-xs'>
                            {p}
                          </Badge>
                        ))}
                        {(role.permissions ?? []).length > 6 ? (
                          <Badge variant='outline' className='text-xs'>
                            +{(role.permissions ?? []).length - 6}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions onView={() => setViewRole(role)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewRole} onOpenChange={(o) => !o && setViewRole(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{viewRole?.label}</DialogTitle>
            <DialogDescription className='font-mono text-xs'>{viewRole?.id}</DialogDescription>
          </DialogHeader>
          {viewRole ? (
            <div className='space-y-3'>
              <p className='text-muted-foreground text-sm'>Permission tokens</p>
              <div className='flex flex-wrap gap-1'>
                {(viewRole.permissions ?? []).map((p) => (
                  <Badge key={p} variant='secondary'>
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </TourismAdminShell>
  )
}
