import { ExternalLink } from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicSiteBrand } from '@/hooks/use-public-site-brand'
import { PortalShowcase } from './components/portal-showcase'
import { UserAuthForm } from './components/user-auth-form'
import './sign-in-portal.css'

export function SignIn() {
  const { redirect } = useSearch({ strict: false }) as { redirect?: string }
  const { brandName, logoUrl, publicSiteUrl, loading } = usePublicSiteBrand()

  return (
    <div className='portal-sign-in-page grid min-h-svh lg:grid-cols-[1fr_1.05fr]'>
      <div className='portal-sign-in-shell relative flex items-center justify-center p-6 sm:p-10 max-lg:order-2'>
        <div className='relative z-10 w-full max-w-[400px]'>
          <Card className='portal-sign-in-card gap-0 overflow-hidden border-[#1a6b6b]/15 py-0'>
            <div className='h-1 bg-gradient-to-r from-[#0f4f4f] via-[#1a6b6b] to-[#e8b923]' />
            <CardHeader className='px-6 pt-6 pb-2'>
              <div className='mb-4 flex items-center gap-3'>
                <div className='flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1a6b6b]/20 bg-background'>
                  {logoUrl && !loading ? (
                    <img src={logoUrl} alt='' className='size-full object-contain p-1.5' />
                  ) : (
                    <span className='text-lg font-bold text-[#1a6b6b]'>RQ</span>
                  )}
                </div>
                <div>
                  <CardTitle className='text-lg leading-tight'>
                    {loading ? 'Sign in' : brandName}
                  </CardTitle>
                  <p className='text-muted-foreground text-xs'>Staff sign in</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-5 px-6 pb-6'>
              <UserAuthForm
                redirectTo={redirect}
                className='portal-auth-form'
                submitClassName='portal-submit-btn h-11 w-full'
              />

              {import.meta.env.DEV ? (
                <p className='text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs'>
                  Dev: <code>admin@tourism.local</code> / <code>ChangeMe123!</code>
                </p>
              ) : null}

              <a
                href={publicSiteUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary flex items-center justify-center gap-1.5 text-xs font-medium hover:underline'
              >
                <ExternalLink className='size-3.5' />
                View public website
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className='max-lg:order-1 max-lg:min-h-[280px] lg:min-h-svh'>
        <PortalShowcase />
      </div>
    </div>
  )
}
