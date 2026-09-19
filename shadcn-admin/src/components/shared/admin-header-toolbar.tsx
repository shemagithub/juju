import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type AdminHeaderToolbarProps = {
  searchPlaceholder?: string
}

/** Compact top bar: jump-to search, theme, account. */
export function AdminHeaderToolbar({
  searchPlaceholder = 'Jump to bookings, packages, blog…',
}: AdminHeaderToolbarProps) {
  return (
    <>
      <Search
        className='min-w-0 flex-1'
        placeholder={searchPlaceholder}
      />
      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </>
  )
}
