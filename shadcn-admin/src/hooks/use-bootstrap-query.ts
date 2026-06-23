import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type BootstrapPayload,
  fetchBootstrapAndHydrate,
} from '@/lib/tourism-bootstrap-sync'

export type { BootstrapPayload }

export function useBootstrapQuery() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['bootstrap', qc],
    queryFn: () => fetchBootstrapAndHydrate(qc),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
