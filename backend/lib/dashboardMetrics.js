const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'short' })

function monthBucket(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return { key, label: MONTH_FMT.format(d) }
}

/** Use stored monthly_metrics when present; otherwise derive from bookings/payments. */
export function resolveMonthlyMetrics(storedRows, rawBookings, rawPayments) {
  if (Array.isArray(storedRows) && storedRows.length > 0) {
    return storedRows.map((m) => ({
      month: m.month_label,
      bookings: Number(m.bookings ?? 0),
      revenueRwf: Number(m.revenue_rwf ?? 0),
    }))
  }

  const bucket = new Map()

  for (const b of rawBookings ?? []) {
    const slot = monthBucket(b.created_at)
    if (!slot) continue
    const cur = bucket.get(slot.key) ?? {
      month: slot.label,
      bookings: 0,
      revenueRwf: 0,
      sortKey: slot.key,
    }
    cur.bookings += 1
    cur.revenueRwf += Number(b.total_rwf ?? 0)
    bucket.set(slot.key, cur)
  }

  if (bucket.size === 0) {
    for (const p of rawPayments ?? []) {
      if (String(p.status ?? '') !== 'completed') continue
      const slot = monthBucket(p.created_at)
      if (!slot) continue
      const cur = bucket.get(slot.key) ?? {
        month: slot.label,
        bookings: 0,
        revenueRwf: 0,
        sortKey: slot.key,
      }
      cur.revenueRwf += Number(p.amount_rwf ?? 0)
      bucket.set(slot.key, cur)
    }
  }

  return [...bucket.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)
    .map(({ month, bookings, revenueRwf }) => ({ month, bookings, revenueRwf }))
}

export function buildDashboardSummary({
  rawBookings,
  rawPayments,
  messages,
  reviews,
  carRentalRequests,
  tourBookingRequests,
  destinations,
  packages,
  carRentalVehicles,
  posts,
  gallery,
  heroSlides,
  pricingPlans,
  tourismUsers,
}) {
  const bookings = rawBookings ?? []
  const payments = rawPayments ?? []

  const paymentsRevenue = payments
    .filter((p) => String(p.status ?? '') === 'completed')
    .reduce((s, p) => s + Number(p.amount_rwf ?? 0), 0)

  const bookingsRevenue = bookings.reduce((s, b) => s + Number(b.total_rwf ?? 0), 0)

  const countByStatus = (rows, field = 'status') => {
    const out = {}
    for (const row of rows ?? []) {
      const key = String(row?.[field] ?? 'unknown')
      out[key] = (out[key] ?? 0) + 1
    }
    return out
  }

  const unread = (rows) =>
    (rows ?? []).filter((r) => r && !r.read_flag).length

  const pending = (rows) =>
    (rows ?? []).filter((r) => String(r?.status ?? '') === 'pending').length

  const tourRequests = tourBookingRequests ?? []
  const mergedBookingsByStatus = { ...countByStatus(bookings) }
  for (const [key, n] of Object.entries(countByStatus(tourRequests))) {
    mergedBookingsByStatus[key] = (mergedBookingsByStatus[key] ?? 0) + n
  }

  return {
    revenueRwf: paymentsRevenue > 0 ? paymentsRevenue : bookingsRevenue,
    paymentsRevenue,
    bookingsRevenue,
    bookingsTotal: bookings.length + tourRequests.length,
    paymentsTotal: payments.length,
    bookingsByStatus: mergedBookingsByStatus,
    messagesTotal: (messages ?? []).length,
    unreadMessages: unread(messages),
    reviewsTotal: (reviews ?? []).length,
    pendingReviews: pending(reviews),
    approvedReviews: (reviews ?? []).filter((r) => String(r?.status ?? '') === 'approved')
      .length,
    carRentalTotal: (carRentalRequests ?? []).length,
    pendingCarRentals: pending(carRentalRequests),
    unreadCarRentals: unread(carRentalRequests),
    tourRequestsTotal: (tourBookingRequests ?? []).length,
    pendingTourRequests: pending(tourBookingRequests),
    unreadTourRequests: unread(tourBookingRequests),
    destinationsTotal: (destinations ?? []).length,
    packagesTotal: (packages ?? []).length,
    fleetTotal: (carRentalVehicles ?? []).length,
    activeFleet: (carRentalVehicles ?? []).filter((v) => v?.active_flag !== 0).length,
    blogPostsTotal: (posts ?? []).length,
    publishedPosts: (posts ?? []).filter((p) => !!p?.published).length,
    galleryTotal: (gallery ?? []).length,
    heroSlidesTotal: (heroSlides ?? []).length,
    pricingPlansTotal: (pricingPlans ?? []).length,
    customersTotal: (tourismUsers ?? []).filter(
      (u) => String(u?.role ?? '') === 'customer',
    ).length,
  }
}
