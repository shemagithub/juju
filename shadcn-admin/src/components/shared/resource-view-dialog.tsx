import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DIALOG_SCROLL_CLASS,
  DIALOG_SIZE_CLASS,
  type AdminDialogSize,
} from '@/components/shared/admin-responsive'
import { cn } from '@/lib/utils'

type ResourceViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onEdit?: () => void
  editLabel?: string
  size?: AdminDialogSize
  children: React.ReactNode
}

/** Read-only details with optional jump to edit. */
export function ResourceViewDialog({
  open,
  onOpenChange,
  title,
  description,
  onEdit,
  editLabel = 'Edit',
  size = 'lg',
  children,
}: ResourceViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_SCROLL_CLASS, DIALOG_SIZE_CLASS[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        <DialogFooter className='gap-2 sm:justify-end'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit ? (
            <Button
              type='button'
              onClick={() => {
                onOpenChange(false)
                onEdit()
              }}
            >
              <Pencil className='me-1.5 size-4' />
              {editLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
