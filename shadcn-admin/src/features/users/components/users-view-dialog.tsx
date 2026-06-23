import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type User } from '../data/schema'

export function UsersViewDialog({
  open,
  onOpenChange,
  currentRow,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {currentRow.firstName} {currentRow.lastName}
          </DialogTitle>
          <DialogDescription className='font-mono text-xs'>{currentRow.id}</DialogDescription>
        </DialogHeader>
        <div className='space-y-2 text-sm'>
          <p>
            <span className='text-muted-foreground'>Username:</span> {currentRow.username}
          </p>
          <p>
            <span className='text-muted-foreground'>Email:</span> {currentRow.email}
          </p>
          <p>
            <span className='text-muted-foreground'>Phone:</span> {currentRow.phoneNumber}
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground'>Role:</span>
            <Badge variant='outline'>{currentRow.role}</Badge>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground'>Status:</span>
            <Badge variant='secondary'>{currentRow.status}</Badge>
          </div>
          <p>
            <span className='text-muted-foreground'>Created:</span>{' '}
            {currentRow.createdAt.toLocaleString()}
          </p>
          <p>
            <span className='text-muted-foreground'>Updated:</span>{' '}
            {currentRow.updatedAt.toLocaleString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
