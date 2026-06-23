import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
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
import { PAYMENT_STATUSES } from '../lib/status-options'
import { usePaymentsQuery } from '../hooks/use-tourism-queries'

type Pay = {
  id: string
  bookingId: string
  amountRwf: number
  status: string
  method: string
  reference: string
  createdAt: string
}

const statusChoices = PAYMENT_STATUSES

export function TourismPaymentsPage({
  variant,
}: {
  variant: 'transactions' | 'status' | 'refunds'
}) {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = usePaymentsQuery()

  const [viewP, setViewP] = useState<Pay | null>(null)
  const [editP, setEditP] = useState<Pay | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteP, setDeleteP] = useState<Pay | null>(null)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/payments/${id}`, { status })
    },
    onSuccess: async () => {
      toast.success('Payment status updated — customer notified by email')
      await qc.invalidateQueries({ queryKey: ['payments'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
    onError: handleServerError,
  })

  const rows = useMemo(() => {
    const list = data as Pay[]
    if (variant === 'refunds')
      return list.filter((p) => /refund|revers/i.test(p.status))
    return list
  }, [data, variant])

  const totalPaid = useMemo(() => {
    return (data as Pay[])
      .filter((p) => p.status === 'paid' || p.status === 'completed')
      .reduce((s, p) => s + (p.amountRwf || 0), 0)
  }, [data])

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editP) return
    setEditSaving(true)
    try {
      await api.patch(`/api/payments/${editP.id}`, {
        status: editP.status,
        amountRwf: editP.amountRwf,
        method: editP.method,
        reference: editP.reference,
      })
      toast.success('Saved')
      setEditP(null)
      await qc.invalidateQueries({ queryKey: ['payments'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteP) return
    setDeleting(true)
    try {
      await api.delete(`/api/payments/${deleteP.id}`)
      toast.success('Payment deleted')
      setDeleteP(null)
      await qc.invalidateQueries({ queryKey: ['payments'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  const title =
    variant === 'refunds'
      ? 'Refunds'
      : variant === 'status'
        ? 'Payment status'
        : 'Transactions'

  return (
    <TourismAdminShell
      title={title}
      description={
        variant === 'status'
          ? 'Review paid vs unpaid. Integrate Flutterwave webhooks for live updates.'
          : 'All payment records from bookings.'
      }
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      {variant === 'transactions' && (
        <Card className='mb-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Revenue snapshot</CardTitle>
            <CardDescription>
              Sum of completed/paid rows:{' '}
              <span className='text-foreground font-semibold'>
                {totalPaid.toLocaleString()} Rwf
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <Card>
        <CardContent className='pt-6'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Amount (Rwf)</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='font-mono text-xs'>{p.reference}</TableCell>
                    <TableCell className='font-mono text-xs'>{p.bookingId}</TableCell>
                    <TableCell>{p.amountRwf?.toLocaleString?.()}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      <AdminStatusSelect
                        value={p.status}
                        options={statusChoices}
                        disabled={updateStatus.isPending || variant === 'refunds'}
                        onChange={(status) =>
                          updateStatus.mutate({ id: p.id, status })
                        }
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={p.reference}
                        onView={() => setViewP(p)}
                        onEdit={
                          variant === 'refunds'
                            ? undefined
                            : () => setEditP({ ...p })
                        }
                        onDelete={() => setDeleteP(p)}
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
        open={!!viewP}
        onOpenChange={(o) => !o && setViewP(null)}
        title='Payment'
        description={viewP?.reference}
        onEdit={viewP && variant !== 'refunds' ? () => setEditP({ ...viewP }) : undefined}
      >
        {viewP ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Booking:</span> {viewP.bookingId}
            </p>
            <p>
              <span className='text-muted-foreground'>Amount:</span>{' '}
              {viewP.amountRwf?.toLocaleString()} Rwf
            </p>
            <p>
              <span className='text-muted-foreground'>Method:</span> {viewP.method}
            </p>
            <p>
              <span className='text-muted-foreground'>Status:</span> {viewP.status}
            </p>
            <p className='text-muted-foreground text-xs'>
              {new Date(viewP.createdAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editP}
        onOpenChange={(o) => !o && setEditP(null)}
        title='Edit payment'
        itemName={editP?.reference}
        onSubmit={saveEdit}
        saving={editSaving}
      >
        {editP ? (
          <>
            <div className='space-y-2'>
              <Label htmlFor='pam'>Amount (Rwf)</Label>
              <Input
                id='pam'
                type='number'
                min={0}
                value={editP.amountRwf}
                onChange={(e) =>
                  setEditP({ ...editP, amountRwf: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pst'>Status</Label>
              <select
                id='pst'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={editP.status}
                onChange={(e) => setEditP({ ...editP, status: e.target.value })}
              >
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pme'>Method</Label>
              <Input
                id='pme'
                value={editP.method}
                onChange={(e) => setEditP({ ...editP, method: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pref'>Reference</Label>
              <Input
                id='pref'
                value={editP.reference}
                onChange={(e) => setEditP({ ...editP, reference: e.target.value })}
              />
            </div>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteP}
        onOpenChange={(o) => !o && setDeleteP(null)}
        title='Delete payment record?'
        desc={<span>Remove payment {deleteP?.reference}?</span>}
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
