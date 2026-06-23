import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type AdminHeaderToolbarProps = {
  searchPlaceholder?: string
}

/** Compact, responsive top bar used on dashboard and tourism pages. */
export function AdminHeaderToolbar({
  searchPlaceholder = 'Search pages, bookings, settings…',
}: AdminHeaderToolbarProps) {
  return (
    <>
      <Search
        className='min-w-0 flex-1'
        placeholder={searchPlaceholder}
      />
      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </>
  )
}
