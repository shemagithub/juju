import { Link } from '@tanstack/react-router'
import { Mountain } from 'lucide-react'
import { resolveAssetUrl } from '@/lib/asset-url'
import { useSiteSettingsQuery } from '@/features/tourism/hooks/use-tourism-queries'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function BrandSidebarHeader() {
  const { setOpenMobile } = useSidebar()
  const { data: settings = {} } = useSiteSettingsQuery()
  const brandName = String(
    (settings as Record<string, unknown>).brandName ?? 'RwandaQuest',
  )
  const logoUrl = resolveAssetUrl(
    String((settings as Record<string, unknown>).logoUrl ?? ''),
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link
            to='/'
            onClick={() => setOpenMobile(false)}
            className='hover:bg-sidebar-accent'
          >
            <div className='flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=''
                  className='size-full object-contain p-0.5'
                />
              ) : (
                <Mountain className='size-4' />
              )}
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{brandName}</span>
              <span className='text-sidebar-foreground/70 truncate text-xs'>
                Staff desk
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
