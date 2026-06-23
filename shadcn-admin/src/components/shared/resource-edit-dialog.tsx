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

type ResourceEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  itemName?: string
  onSubmit: (e: React.FormEvent) => void
  saving?: boolean
  saveLabel?: string
  size?: AdminDialogSize
  children: React.ReactNode
}

/** Consistent edit modal: clear title, Cancel + Save footer. */
export function ResourceEditDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onSubmit,
  saving = false,
  saveLabel = 'Save changes',
  size = 'lg',
  children,
}: ResourceEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(DIALOG_SCROLL_CLASS, DIALOG_SIZE_CLASS[size])}
        onInteractOutside={(e) => saving && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
          {itemName ? (
            <p className='text-foreground pt-1 text-sm font-medium'>{itemName}</p>
          ) : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className='min-w-0 space-y-4'>
          {children}
          <DialogFooter className='gap-2 border-t pt-4 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving…' : saveLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
