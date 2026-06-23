import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AdminTableCardProps = {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Card wrapper for data tables — single scroll owner, responsive padding. */
export function AdminTableCard({
  title,
  description,
  action,
  className,
  children,
}: AdminTableCardProps) {
  return (
    <Card className={cn('min-w-0 overflow-hidden', className)}>
      {title || description || action ? (
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 space-y-1'>
            {title ? <CardTitle className='text-base sm:text-lg'>{title}</CardTitle> : null}
            {description ? (
              <CardDescription className='text-pretty'>{description}</CardDescription>
            ) : null}
          </div>
          {action ? (
            <div className='flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end'>
              {action}
            </div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className='min-w-0 px-3 sm:px-6'>{children}</CardContent>
    </Card>
  )
}
