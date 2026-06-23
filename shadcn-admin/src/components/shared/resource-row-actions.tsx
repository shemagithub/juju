import { Link } from '@tanstack/react-router'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ResourceRowActionsProps = {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  editTo?: string
  editParams?: Record<string, string>
  itemLabel?: string
  className?: string
}

function ActionControl({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side='top'>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ResourceRowActions({
  onView,
  onEdit,
  onDelete,
  editTo,
  editParams,
  itemLabel,
  className,
}: ResourceRowActionsProps) {
  const showEdit = Boolean(onEdit || editTo)
  const editTip = itemLabel ? `Edit ${itemLabel}` : 'Edit item'
  const viewTip = itemLabel ? `View ${itemLabel}` : 'View details'
  const deleteTip = itemLabel ? `Delete ${itemLabel}` : 'Delete item'

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'inline-flex flex-wrap items-center justify-end gap-1',
          className,
        )}
      >
        {onView ? (
          <ActionControl label={viewTip}>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 px-2.5'
              aria-label={viewTip}
              onClick={onView}
            >
              <Eye className='size-3.5 shrink-0' />
              <span className='hidden sm:inline'>View</span>
            </Button>
          </ActionControl>
        ) : null}

        {showEdit ? (
          editTo ? (
            <ActionControl label={editTip}>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 gap-1.5 px-2.5'
                aria-label={editTip}
                asChild
              >
                <Link to={editTo} params={editParams}>
                  <Pencil className='size-3.5 shrink-0' />
                  <span className='hidden sm:inline'>Edit</span>
                </Link>
              </Button>
            </ActionControl>
          ) : (
            <ActionControl label={editTip}>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 gap-1.5 px-2.5'
                aria-label={editTip}
                onClick={onEdit}
              >
                <Pencil className='size-3.5 shrink-0' />
                <span className='hidden sm:inline'>Edit</span>
              </Button>
            </ActionControl>
          )
        ) : null}

        {onDelete ? (
          <ActionControl label={deleteTip}>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='text-destructive hover:text-destructive h-8 gap-1.5 px-2.5'
              aria-label={deleteTip}
              onClick={onDelete}
            >
              <Trash2 className='size-3.5 shrink-0' />
              <span className='hidden sm:inline'>Delete</span>
            </Button>
          </ActionControl>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
