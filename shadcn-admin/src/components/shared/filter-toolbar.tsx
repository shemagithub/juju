import { FILTER_TOOLBAR_CLASS } from '@/components/shared/admin-responsive'
import { cn } from '@/lib/utils'

type FilterToolbarProps = {
  className?: string
  children: React.ReactNode
}

/** Responsive filter row — stacks on mobile, grid on larger screens. */
export function FilterToolbar({ className, children }: FilterToolbarProps) {
  return (
    <div className={cn(FILTER_TOOLBAR_CLASS, className)}>
      {children}
    </div>
  )
}

type FilterFieldProps = {
  className?: string
  children: React.ReactNode
}

export function FilterField({ className, children }: FilterFieldProps) {
  return <div className={cn('min-w-0 w-full', className)}>{children}</div>
}
