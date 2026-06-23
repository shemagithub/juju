import { AxiosError } from 'axios'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

import { fetchBootstrapAndHydrate } from '@/lib/tourism-bootstrap-sync'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context }) => {
    const auth = useAuthStore.getState().auth
    const { accessToken, user, setUser, reset } = auth
    if (!accessToken) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    if (!user) {
      try {
        const res = await api.get('/api/auth/me')
        if (res?.data?.user) setUser(res.data.user)
      } catch (err) {
        const status =
          err instanceof AxiosError ? err.response?.status : undefined
        // Invalid/expired token or revoked session — clear client auth instead of crashing the router.
        if (status === 401 || status === 403) {
          reset()
          throw redirect({
            to: '/sign-in',
            search: { redirect: location.href },
          })
        }
        // Backend unreachable or other errors: keep token; user profile stays empty until a retry.
      }
    }
    try {
      await context.queryClient.prefetchQuery({
        queryKey: ['bootstrap', context.queryClient],
        queryFn: () => fetchBootstrapAndHydrate(context.queryClient),
      })
    } catch {
      // API offline or bootstrap failing — feature queries can still fetch individually.
    }
  },
  component: AuthenticatedLayout,
})
