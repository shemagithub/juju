import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { resolveAssetUrl } from '@/lib/asset-url'

const DEFAULTS = {
  brandName: 'RwandaQuest',
  companyDescription:
    'Manage gorilla trekking, safari packages, car rental, and your public travel website.',
  logoUrl: '',
  publicSiteUrl: 'http://localhost:3000',
}

export function usePublicSiteBrand() {
  const [brand, setBrand] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/site-settings')
      .then((res) => {
        if (cancelled) return
        const s = res.data as Record<string, unknown>
        setBrand({
          brandName: String(s.brandName ?? DEFAULTS.brandName),
          companyDescription: String(
            s.companyDescription ?? s.footerDescription ?? DEFAULTS.companyDescription,
          ),
          logoUrl: resolveAssetUrl(String(s.logoUrl ?? '')),
          publicSiteUrl: String(s.publicSiteUrl ?? DEFAULTS.publicSiteUrl).replace(
            /\/$/,
            '',
          ),
        })
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { ...brand, loading }
}
