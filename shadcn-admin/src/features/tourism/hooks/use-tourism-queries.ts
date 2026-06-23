import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useTourPackagesQuery() {
  return useQuery({
    queryKey: ['tour-packages'],
    queryFn: async () => (await api.get('/api/tour-packages')).data,
  })
}

export function usePackageCategoriesQuery() {
  return useQuery({
    queryKey: ['package-categories'],
    queryFn: async () => (await api.get('/api/package-categories')).data,
  })
}

export function useDestinationsQuery() {
  return useQuery({
    queryKey: ['destinations'],
    queryFn: async () => (await api.get('/api/destinations')).data,
  })
}

export function useBookingsQuery() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/api/bookings')).data,
  })
}

export type CarRentalRequestsSummary = {
  total: number
  unread: number
  byStatus: Record<string, number>
}

export type CarRentalFleetSummary = {
  total: number
  active: number
  inactive: number
}

/** Query params mirrored by backend GET /api/car-rental-requests */
export type CarRentalRequestListParams = {
  status?: string
  vehicleClass?: string
  read?: 'true' | 'false'
  q?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export type CarRentalVehicleListParams = {
  q?: string
  active?: 'true' | 'false'
  limit?: number
}

export function useCarRentalRequestsSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: ['car-rental-requests-summary'],
    enabled,
    queryFn: async (): Promise<CarRentalRequestsSummary> =>
      (await api.get('/api/car-rental-requests/summary')).data,
  })
}

export function useCarRentalRequestsQuery(params: CarRentalRequestListParams = {}) {
  return useQuery({
    queryKey: ['car-rental-requests', params],
    queryFn: async () =>
      (
        await api.get('/api/car-rental-requests', {
          params,
        })
      ).data,
  })
}

export function useCarRentalVehiclesSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: ['car-rental-vehicles-summary'],
    enabled,
    queryFn: async (): Promise<CarRentalFleetSummary> =>
      (await api.get('/api/car-rental-vehicles/summary')).data,
  })
}

export function useCarRentalVehiclesQuery(params: CarRentalVehicleListParams = {}) {
  return useQuery({
    queryKey: ['car-rental-vehicles', params],
    queryFn: async () =>
      (
        await api.get('/api/car-rental-vehicles', {
          params,
        })
      ).data,
  })
}

export function useCarRentalVehicleQuery(vehicleId?: string) {
  return useQuery({
    queryKey: ['car-rental-vehicle', vehicleId],
    enabled: Boolean(vehicleId),
    queryFn: async () => (await api.get(`/api/car-rental-vehicles/${vehicleId}`)).data,
  })
}

export type CarRentalVehicleCategory = {
  id: string
  name: string
  slug: string
  sortOrder: number
  active: boolean
  vehicleCount: number
}

export function useCarRentalVehicleCategoriesQuery(activeOnly = false) {
  return useQuery({
    queryKey: ['car-rental-vehicle-categories', activeOnly ? 'active' : 'all'],
    queryFn: async (): Promise<CarRentalVehicleCategory[]> =>
      (
        await api.get('/api/car-rental-vehicle-categories', {
          params: activeOnly ? { active: 'true' } : undefined,
        })
      ).data,
  })
}

export function useHeroSlidesQuery(publicOnly = false) {
  return useQuery({
    queryKey: ['hero-slides', publicOnly ? 'public' : 'all'],
    queryFn: async () =>
      (
        await api.get('/api/hero-slides', {
          params: publicOnly ? { public: 'true' } : undefined,
        })
      ).data,
  })
}

export function useTeamMembersQuery(publicOnly = false) {
  return useQuery({
    queryKey: ['team-members', publicOnly ? 'public' : 'all'],
    queryFn: async () =>
      (
        await api.get('/api/team-members', {
          params: publicOnly ? { public: 'true' } : undefined,
        })
      ).data,
  })
}

export function usePricingQuery(publicOnly = false) {
  return useQuery({
    queryKey: ['pricing', publicOnly ? 'public' : 'all'],
    queryFn: async () =>
      (
        await api.get('/api/pricing', {
          params: publicOnly ? { public: 'true' } : undefined,
        })
      ).data,
  })
}

export function usePaymentsQuery() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => (await api.get('/api/payments')).data,
  })
}

export function useMessagesQuery() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: async () => (await api.get('/api/messages')).data,
  })
}

export function useReviewsQuery() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: async () => (await api.get('/api/reviews')).data,
  })
}

export function useBlogPostsQuery() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => (await api.get('/api/blog/posts')).data,
  })
}

export function useBlogCategoriesQuery() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => (await api.get('/api/blog/categories')).data,
  })
}

export function useGalleryQuery() {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: async () => (await api.get('/api/gallery')).data,
  })
}

export function useTourGuidesQuery() {
  return useQuery({
    queryKey: ['tour-guides'],
    queryFn: async () => (await api.get('/api/tour-guides')).data,
  })
}

export function useUsersApiQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/users')).data,
  })
}

export function useActivityLogsQuery() {
  return useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => (await api.get('/api/activity-logs')).data,
  })
}

export function useRoleDefinitionsQuery() {
  return useQuery({
    queryKey: ['role-definitions'],
    queryFn: async () => (await api.get('/api/role-definitions')).data,
  })
}

export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await api.get('/api/site-settings')).data,
  })
}

export type TourBookingRequestsSummary = {
  total: number
  unread: number
  byStatus: Record<string, number>
}

export function useTourBookingRequestsSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: ['tour-booking-requests-summary'],
    enabled,
    queryFn: async (): Promise<TourBookingRequestsSummary> =>
      (await api.get('/api/tour-booking-requests/summary')).data,
  })
}

export function useTourBookingRequestsQuery(params: {
  status?: string
  read?: 'true' | 'false'
  q?: string
} = {}) {
  return useQuery({
    queryKey: ['tour-booking-requests', params],
    queryFn: async () =>
      (await api.get('/api/tour-booking-requests', { params })).data,
  })
}
