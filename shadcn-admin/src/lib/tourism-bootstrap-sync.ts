import { type QueryClient } from '@tanstack/react-query'
import {
  type ApiTourismUser,
  apiUserToUser,
} from '@/features/users/data/adapters'
import { type User } from '@/features/users/data/schema'
import { api } from '@/lib/api'
import { applyAdminSiteMeta } from '@/lib/apply-site-meta'

/** Payload from `GET /api/bootstrap` (Juliet tourism backend). */
export type BootstrapPayload = {
  tourismUsers: unknown[]
  packageCategories: unknown[]
  destinations: unknown[]
  packages: unknown[]
  bookings: unknown[]
  tourBookingRequests?: unknown[]
  carRentalRequests?: unknown[]
  carRentalVehicles?: unknown[]
  payments: unknown[]
  messages: unknown[]
  reviews: unknown[]
  dashboardSummary?: DashboardSummary
  blogCategories: unknown[]
  posts: unknown[]
  gallery: unknown[]
  guides: unknown[]
  monthlyMetrics: { month: string; bookings: number; revenueRwf: number }[]
  notifications: unknown[]
  activityLogs: unknown[]
  roleDefinitions: unknown[]
  settings: Record<string, unknown>
  adminSettings?: Record<string, unknown>
}

export type DashboardSummary = {
  revenueRwf: number
  paymentsRevenue: number
  bookingsRevenue: number
  bookingsTotal: number
  paymentsTotal: number
  bookingsByStatus: Record<string, number>
  messagesTotal: number
  unreadMessages: number
  reviewsTotal: number
  pendingReviews: number
  approvedReviews: number
  carRentalTotal: number
  pendingCarRentals: number
  unreadCarRentals: number
  tourRequestsTotal: number
  pendingTourRequests: number
  unreadTourRequests: number
  destinationsTotal: number
  packagesTotal: number
  fleetTotal: number
  activeFleet: number
  blogPostsTotal: number
  publishedPosts: number
  galleryTotal: number
  heroSlidesTotal: number
  pricingPlansTotal: number
  customersTotal: number
}

/** Mirrors TanStack keys used in `@/features/tourism/hooks/use-tourism-queries` and related hooks. */
export function hydrateTourismCaches(qc: QueryClient, data: BootstrapPayload) {
  qc.setQueryData(['tour-packages'], data.packages)
  qc.setQueryData(['package-categories'], data.packageCategories)
  qc.setQueryData(['destinations'], data.destinations)
  qc.setQueryData(['bookings'], data.bookings)
  qc.setQueryData(['payments'], data.payments)
  qc.setQueryData(['messages'], data.messages)
  qc.setQueryData(['reviews'], data.reviews)
  qc.setQueryData(['blog-posts'], data.posts)
  qc.setQueryData(['blog-categories'], data.blogCategories)
  qc.setQueryData(['gallery'], data.gallery)
  qc.setQueryData(['tour-guides'], data.guides)
  qc.setQueryData(['activity-logs'], data.activityLogs)
  qc.setQueryData(['role-definitions'], data.roleDefinitions)
  qc.setQueryData(['site-settings'], data.settings)
  applyAdminSiteMeta(data.settings ?? {})

  if (data.adminSettings !== undefined) {
    qc.setQueryData(['admin-settings'], data.adminSettings)
  }

  const rawUsers = (data.tourismUsers ?? []) as ApiTourismUser[]
  qc.setQueryData<User[]>(['users'], rawUsers.map(apiUserToUser))

  if (data.tourBookingRequests !== undefined) {
    qc.setQueryData(['tour-booking-requests', {}], data.tourBookingRequests)
    try {
      const reqs = data.tourBookingRequests as { status?: string; read?: boolean }[]
      const byStatus: Record<string, number> = {}
      for (const r of reqs) {
        const s = String(r?.status ?? 'unknown')
        byStatus[s] = (byStatus[s] ?? 0) + 1
      }
      qc.setQueryData(['tour-booking-requests-summary'], {
        total: reqs.length,
        unread: reqs.filter((r) => r && !r.read).length,
        byStatus,
      })
    } catch {
      /* ignore */
    }
  }

  if (data.carRentalRequests !== undefined) {
    qc.setQueryData(['car-rental-requests', {}], data.carRentalRequests)
  }
  if (data.carRentalVehicles !== undefined) {
    qc.setQueryData(['car-rental-vehicles', {}], data.carRentalVehicles)
  }

  try {
    const reqs = (data.carRentalRequests ?? []) as {
      status?: string
      read?: boolean
    }[]
    const total = reqs.length
    const unread = reqs.filter((r) => r && !r.read).length
    const byStatus: Record<string, number> = {}
    for (const r of reqs) {
      const s = String(r?.status ?? 'unknown')
      byStatus[s] = (byStatus[s] ?? 0) + 1
    }
    qc.setQueryData(['car-rental-requests-summary'], {
      total,
      unread,
      byStatus,
    })
  } catch {
    /* ignore malformed bootstrap slices */
  }

  try {
    const fleet = (data.carRentalVehicles ?? []) as { active?: boolean }[]
    const total = fleet.length
    const active = fleet.filter((v) => v && v.active !== false).length
    qc.setQueryData(['car-rental-vehicles-summary'], {
      total,
      active,
      inactive: Math.max(0, total - active),
    })
  } catch {
    /* ignore */
  }
}

export async function fetchBootstrapAndHydrate(
  qc: QueryClient,
): Promise<BootstrapPayload> {
  const { data } = await api.get<BootstrapPayload>('/api/bootstrap')
  hydrateTourismCaches(qc, data)
  return data
}
