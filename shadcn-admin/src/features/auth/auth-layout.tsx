import { Link } from '@tanstack/react-router'
import { ExternalLink, Shield } from 'lucide-react'
import { usePublicSiteBrand } from '@/hooks/use-public-site-brand'
import './sign-in/sign-in-portal.css'

type AuthLayoutProps = {
  children: React.ReactNode
}

/** Shared auth shell for forgot-password / sign-up — matches tourism portal branding. */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { brandName, logoUrl, publicSiteUrl, loading } = usePublicSiteBrand()

  return (
    <div className='portal-sign-in-shell relative flex min-h-svh flex-col items-center justify-center p-6'>
      <div className='relative z-10 mx-auto flex w-full max-w-md flex-col space-y-6'>
        <div className='flex items-center justify-center gap-3'>
          <div className='flex size-12 items-center justify-center overflow-hidden rounded-xl border border-[#1a6b6b]/20 bg-background shadow-sm'>
            {logoUrl && !loading ? (
              <img src={logoUrl} alt='' className='size-full object-contain p-1.5' />
            ) : (
              <Shield className='size-5 text-[#1a6b6b]' />
            )}
          </div>
          <div className='text-start'>
            <span className='text-[10px] font-bold tracking-widest text-[#1a6b6b] uppercase'>
              Staff portal
            </span>
            <h1 className='text-lg font-semibold leading-tight'>
              {loading ? 'Operations portal' : `${brandName} Admin`}
            </h1>
            <p className='text-muted-foreground text-xs'>
              Tourism & car rental operations
            </p>
          </div>
        </div>
        {children}
        <p className='text-center text-xs'>
          <Link
            to='/sign-in'
            className='font-medium text-[#1a6b6b] hover:underline'
          >
            Back to sign in
          </Link>
          {' · '}
          <a
            href={publicSiteUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 text-muted-foreground hover:text-[#1a6b6b]'
          >
            <ExternalLink className='size-3' />
            Travel website
          </a>
        </p>
      </div>
    </div>
  )
}
