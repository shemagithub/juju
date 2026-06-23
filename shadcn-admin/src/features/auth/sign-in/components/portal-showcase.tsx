import {
  CalendarDays,
  Car,
  Globe,
  MapPinned,
  Mountain,
  Package,
  Users,
} from 'lucide-react'
import { usePublicSiteBrand } from '@/hooks/use-public-site-brand'

const TOURISM_ITEMS = [
  { icon: Package, label: 'Safari packages' },
  { icon: MapPinned, label: 'Destinations' },
  { icon: CalendarDays, label: 'Bookings inbox' },
  { icon: Users, label: 'Team & about page' },
] as const

const RENTAL_ITEMS = [
  { icon: Car, label: 'Fleet vehicles' },
  { icon: CalendarDays, label: 'Quote requests' },
  { icon: Globe, label: 'Rental page content' },
] as const

export function PortalShowcase() {
  const { brandName, companyDescription, logoUrl, loading } = usePublicSiteBrand()

  return (
    <div className='portal-showcase relative flex h-full min-h-[420px] flex-col overflow-hidden p-8 text-white lg:min-h-svh lg:p-10 xl:p-12'>
      <div className='portal-showcase-glow pointer-events-none absolute inset-0' aria-hidden />
      <div
        className='portal-showcase-pattern pointer-events-none absolute inset-0 opacity-60'
        aria-hidden
      />

      <div className='relative z-10 flex flex-1 flex-col'>
        <div className='mb-8 flex items-center gap-4'>
          <div className='flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm'>
            {logoUrl && !loading ? (
              <img
                src={logoUrl}
                alt=''
                className='size-full object-contain p-2'
              />
            ) : (
              <Mountain className='size-8 text-[#e8b923]' />
            )}
          </div>
          <div>
            <span className='portal-hero-label'>Operations portal</span>
            <h1 className='portal-title-bold mt-1'>
              {loading ? 'Tourism & Car Rental' : brandName}
            </h1>
            <span className='portal-title-script mt-0.5'>
              Safari operations · Rental desk · Live website
            </span>
          </div>
        </div>

        <p className='max-w-lg text-sm leading-relaxed text-white/88 lg:text-[15px]'>
          {companyDescription}
        </p>

        <div className='mt-6 flex flex-wrap gap-2'>
          <div className='portal-stat-pill rounded-full px-3 py-1.5 text-xs'>
            <span className='font-semibold text-[#e8b923]'>Tourism</span>
            <span className='text-white/75'> · Packages & bookings</span>
          </div>
          <div className='portal-stat-pill rounded-full px-3 py-1.5 text-xs'>
            <span className='font-semibold text-[#e8b923]'>Car rental</span>
            <span className='text-white/75'> · Fleet & quotes</span>
          </div>
          <div className='portal-stat-pill rounded-full px-3 py-1.5 text-xs'>
            <span className='font-semibold text-[#e8b923]'>Website</span>
            <span className='text-white/75'> · Brand & content</span>
          </div>
        </div>

        <div className='mt-8 grid flex-1 gap-4 lg:grid-cols-2 lg:content-start'>
          <div className='portal-desk-card rounded-2xl p-5'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-xl bg-[#e8b923]/20'>
                <Mountain className='size-5 text-[#e8b923]' />
              </div>
              <div>
                <p className='text-sm font-bold'>Tourism desk</p>
                <p className='text-xs text-white/70'>Gorilla treks, safaris & trips</p>
              </div>
            </div>
            <ul className='grid gap-2 sm:grid-cols-2'>
              {TOURISM_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className='flex items-center gap-2 text-xs text-white/85'
                >
                  <item.icon className='size-3.5 shrink-0 text-[#e8b923]' />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className='portal-desk-card portal-desk-card--rental rounded-2xl p-5'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-xl bg-[#e8b923]/20'>
                <Car className='size-5 text-[#e8b923]' />
              </div>
              <div>
                <p className='text-sm font-bold'>Car rental desk</p>
                <p className='text-xs text-white/70'>Fleet, pricing & lead quotes</p>
              </div>
            </div>
            <ul className='grid gap-2'>
              {RENTAL_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className='flex items-center gap-2 text-xs text-white/85'
                >
                  <item.icon className='size-3.5 shrink-0 text-[#e8b923]' />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-xs text-white/65'>
          <span className='inline-flex items-center gap-1.5'>
            <MapPinned className='size-3.5 text-[#e8b923]' />
            Rwanda & East Africa tours
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <Globe className='size-3.5 text-[#e8b923]' />
            Public travel website CMS
          </span>
        </div>
      </div>
    </div>
  )
}
