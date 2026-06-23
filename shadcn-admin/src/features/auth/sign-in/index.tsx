import { ExternalLink, Car, Globe, Mountain, Shield } from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePublicSiteBrand } from '@/hooks/use-public-site-brand'
import { PortalShowcase } from './components/portal-showcase'
import { UserAuthForm } from './components/user-auth-form'
import './sign-in-portal.css'

const ACCESS_AREAS = [
  { icon: Mountain, label: 'Tourism & bookings' },
  { icon: Car, label: 'Car rental quotes' },
  { icon: Globe, label: 'Travel website CMS' },
] as const

export function SignIn() {
  const { redirect } = useSearch({ strict: false }) as { redirect?: string }
  const { brandName, logoUrl, publicSiteUrl, loading } = usePublicSiteBrand()

  return (
    <div className='portal-sign-in-page grid min-h-svh lg:grid-cols-[0.92fr_1.08fr]'>
      <div className='portal-sign-in-shell relative flex max-lg:order-2 items-center justify-center p-6 sm:p-10'>
        <div className='relative z-10 w-full max-w-[440px]'>
          <Card className='portal-sign-in-card gap-0 overflow-hidden border-[#1a6b6b]/15 py-0'>
            <div className='h-1 bg-gradient-to-r from-[#0f4f4f] via-[#1a6b6b] to-[#e8b923]' />

            <CardHeader className='space-y-4 border-b bg-muted/25 px-6 pt-6 pb-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1a6b6b]/20 bg-background shadow-sm'>
                    {logoUrl && !loading ? (
                      <img
                        src={logoUrl}
                        alt=''
                        className='size-full object-contain p-1.5'
                      />
                    ) : (
                      <Shield className='size-5 text-[#1a6b6b]' />
                    )}
                  </div>
                  <div>
                    <span className='text-[10px] font-bold tracking-widest text-[#1a6b6b] uppercase'>
                      Staff portal
                    </span>
                    <CardTitle className='text-lg leading-tight'>
                      {loading ? 'Sign in' : `${brandName} Admin`}
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Tourism operations & car rental desk
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className='shrink-0 border-[#1a6b6b]/30 text-[#1a6b6b]'
                >
                  Secure
                </Badge>
              </div>

              <div className='flex flex-wrap gap-2'>
                {ACCESS_AREAS.map((area) => (
                  <span
                    key={area.label}
                    className='portal-desk-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1'
                  >
                    <area.icon className='size-3' />
                    {area.label}
                  </span>
                ))}
              </div>
            </CardHeader>

            <CardContent className='space-y-5 px-6 py-6'>
              <div>
                <h2 className='text-base font-semibold tracking-tight'>
                  Sign in to your desk
                </h2>
                <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
                  One login for safari packages, booking requests, car rental
                  quotes, messages, and your public travel website.
                </p>
              </div>

              <UserAuthForm
                redirectTo={redirect}
                className='portal-auth-form'
                submitClassName='portal-submit-btn h-11 w-full'
              />

              <div className='portal-access-list rounded-xl px-4 py-3'>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  <span className='font-medium text-foreground'>After sign-in:</span>{' '}
                  use the dashboard inbox for new bookings and rental quotes, or
                  open Page manager to update the live travel site.
                </p>
              </div>

              {import.meta.env.DEV ? (
                <div className='rounded-lg border border-dashed border-[#1a6b6b]/25 bg-[#1a6b6b]/5 px-3 py-2.5 text-xs text-muted-foreground'>
                  <span className='font-medium text-foreground'>Dev login</span>
                  <br />
                  <code className='text-[11px]'>superadmin@tourism.local</code> or{' '}
                  <code className='text-[11px]'>admin@tourism.local</code>
                  <br />
                  Password: <code className='text-[11px]'>ChangeMe123!</code>
                </div>
              ) : null}

              <div className='flex flex-col gap-2 border-t pt-4 text-center text-xs text-muted-foreground'>
                <a
                  href={publicSiteUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center justify-center gap-1.5 font-medium text-[#1a6b6b] hover:underline'
                >
                  <ExternalLink className='size-3.5' />
                  View public travel website
                </a>
                <p>Authorized staff only. Contact your administrator for access.</p>
              </div>
            </CardContent>
          </Card>

          <p className='text-muted-foreground mt-4 text-center text-xs'>
            {loading ? 'Operations portal' : `${brandName}`} — internal tourism &
            car rental management.
          </p>
        </div>
      </div>

      <div className='max-lg:order-1 max-lg:min-h-[480px] lg:min-h-svh'>
        <PortalShowcase />
      </div>
    </div>
  )
}
