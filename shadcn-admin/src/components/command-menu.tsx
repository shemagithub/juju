import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  CalendarDays,
  Car,
  Laptop,
  Moon,
  Newspaper,
  Package,
  Plus,
  Sun,
} from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { resolveNavTo } from '@/lib/nav-to'
import { sidebarData } from './layout/data/sidebar-data'
import { ScrollArea } from './ui/scroll-area'

const SHORTCUTS = [
  { title: 'Confirm a booking', url: '/bookings/pending', icon: CalendarDays },
  { title: 'Add a tour package', url: '/tour-packages/new', icon: Package },
  { title: 'Write a blog post', url: '/blog/new', icon: Newspaper },
  { title: 'Add a rental vehicle', url: '/car-rental/vehicles/new', icon: Car },
  { title: 'New car quote', url: '/car-rental/pending', icon: Plus },
] as const

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type what you want: bookings, package, blog…' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No match. Try “booking”, “package”, or “blog”.</CommandEmpty>
          <CommandGroup heading='Get this done'>
            {SHORTCUTS.map((item) => (
              <CommandItem
                key={item.url}
                value={`${item.title} ${item.url}`}
                onSelect={() => {
                  runCommand(() => navigate(resolveNavTo(item.url)))
                }}
              >
                <item.icon />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={`${navItem.title} ${navItem.url}`}
                      onSelect={() => {
                        runCommand(() => navigate(resolveNavTo(navItem.url)))
                      }}
                    >
                      <div className='flex size-4 items-center justify-center'>
                        <ArrowRight className='size-2 text-muted-foreground/80' />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${navItem.title}-${subItem.url}-${i}`}
                    value={`${navItem.title} ${subItem.title} ${subItem.url}`}
                    onSelect={() => {
                      runCommand(() => navigate(resolveNavTo(subItem.url)))
                    }}
                  >
                    <div className='flex size-4 items-center justify-center'>
                      <ArrowRight className='size-2 text-muted-foreground/80' />
                    </div>
                    {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
