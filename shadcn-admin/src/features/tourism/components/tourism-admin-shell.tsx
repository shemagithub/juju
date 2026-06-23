import { AdminHeaderToolbar } from '@/components/shared/admin-header-toolbar'
import { PAGE_ACTIONS_CLASS } from '@/components/shared/admin-responsive'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { cn } from '@/lib/utils'

type TourismAdminShellProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function TourismAdminShell({
  title,
  description,
  actions,
  children,
}: TourismAdminShellProps) {
  return (
    <>
      <Header fixed>
        <AdminHeaderToolbar />
      </Header>
      <Main
        fixed
        fluid
        className='flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain sm:gap-6'
      >
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <h2 className='text-xl font-bold tracking-tight text-balance sm:text-2xl'>
              {title}
            </h2>
            {description ? (
              <p className='text-muted-foreground mt-1 max-w-2xl text-pretty text-sm sm:text-base'>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className={cn(PAGE_ACTIONS_CLASS)}>{actions}</div>
          ) : null}
        </div>
        <div className='min-w-0 flex-1'>{children}</div>
      </Main>
    </>
  )
}
