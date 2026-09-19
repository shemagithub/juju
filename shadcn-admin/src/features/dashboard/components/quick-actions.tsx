import { Link } from '@tanstack/react-router'
import {
  Car,
  Image,
  Package,
  PenLine,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACTIONS = [
  {
    title: 'Add a package',
    description: 'New gorilla trek or safari',
    to: '/tour-packages/new',
    icon: Package,
  },
  {
    title: 'Write a blog post',
    description: 'Story with photos in the text',
    to: '/blog/new',
    icon: PenLine,
  },
  {
    title: 'Add a vehicle',
    description: 'Show it on car rental',
    to: '/car-rental/vehicles/new',
    icon: Car,
  },
  {
    title: 'Change homepage',
    description: 'Hero slides visitors see first',
    to: '/website/hero',
    icon: Sparkles,
  },
  {
    title: 'Phone & logo',
    description: 'Contact details on every page',
    to: '/settings/contact',
    icon: Settings,
  },
  {
    title: 'Upload photos',
    description: 'Gallery on the travel site',
    to: '/gallery/upload',
    icon: Image,
  },
] as const

export function QuickActions() {
  return (
    <section>
      <div className='mb-3 flex items-end justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold'>Do this next</h2>
          <p className='text-muted-foreground text-sm'>
            The usual jobs to keep the website selling.
          </p>
        </div>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/website'>All pages</Link>
        </Button>
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className='bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors'
          >
            <div className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
              <action.icon className='size-4' />
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-semibold'>{action.title}</p>
              <p className='text-muted-foreground text-xs'>{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
