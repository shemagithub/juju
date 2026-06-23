import { parseJson } from '../lib/helpers.js'
import { buildDashboardSummary, resolveMonthlyMetrics } from '../lib/dashboardMetrics.js'
import { mapCarRentalVehicle } from './carRentalFleet.js'
import { mapTourBookingRequest } from './bookingRequests.js'
import { destinationsWithLinks, packagesFull } from '../lib/services.js'

async function safeRows(pool, sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params)
    return rows ?? []
  } catch {
    return []
  }
}

export function registerBootstrapRoute(app, pool) {
  app.get('/api/bootstrap', async (_req, res, next) => {
    try {
      const [
        users,
        packageCategories,
        destinations,
        packages,
        bookings,
        payments,
        messages,
        carRentalRows,
        carRentalVehicleRows,
        reviews,
        blogCategories,
        posts,
        gallery,
        guides,
        tourBookingRows,
        heroSlideRows,
        pricingPlanRows,
        monthlyMetricRows,
        notifications,
        activityLogs,
        roleDefinitions,
        settingsRow,
        adminSettingsRow,
        bookRows,
      ] = await Promise.all([
        safeRows(pool, 'SELECT * FROM tourism_users ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM package_categories ORDER BY name'),
        destinationsWithLinks(pool),
        packagesFull(pool),
        safeRows(pool, 'SELECT * FROM bookings ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM payments ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM message_threads ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM car_rental_requests ORDER BY created_at DESC'),
        safeRows(
          pool,
          'SELECT * FROM car_rental_vehicles ORDER BY sort_order ASC, title ASC',
        ),
        safeRows(pool, 'SELECT * FROM reviews ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM blog_categories ORDER BY name'),
        safeRows(pool, 'SELECT * FROM blog_posts ORDER BY updated_at DESC'),
        safeRows(pool, 'SELECT * FROM gallery_items ORDER BY updated_at DESC'),
        safeRows(pool, 'SELECT * FROM tour_guides ORDER BY id'),
        safeRows(pool, 'SELECT * FROM tour_booking_requests ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT id FROM hero_slides WHERE active_flag = 1'),
        safeRows(pool, 'SELECT id FROM pricing_plans WHERE active_flag = 1'),
        safeRows(pool, 'SELECT * FROM monthly_metrics ORDER BY sort_order ASC'),
        safeRows(pool, 'SELECT * FROM admin_notifications ORDER BY created_at DESC'),
        safeRows(pool, 'SELECT * FROM activity_logs ORDER BY at DESC LIMIT 200'),
        safeRows(pool, 'SELECT * FROM role_definitions ORDER BY id'),
        safeRows(pool, 'SELECT payload FROM site_settings WHERE singleton = 1 LIMIT 1'),
        safeRows(pool, 'SELECT payload FROM admin_settings WHERE singleton = 1 LIMIT 1'),
        safeRows(pool, 'SELECT id, guide_id FROM bookings WHERE guide_id IS NOT NULL'),
      ])

      const settings = parseJson(settingsRow[0]?.payload, {})
      const adminSettings = parseJson(adminSettingsRow[0]?.payload, {})

      const mapBooking = (r) => {
        const sd =
          typeof r.start_date === 'string'
            ? r.start_date
            : new Date(r.start_date).toISOString().slice(0, 10)
        return {
          id: r.id,
          userId: r.user_id,
          packageId: r.package_id,
          startDate: sd,
          status: r.status,
          totalRwf: Number(r.total_rwf),
          guideId: r.guide_id,
          createdAt: new Date(r.created_at).toISOString(),
        }
      }

      const guideBookings = {}
      for (const b of bookRows) {
        guideBookings[b.guide_id] = guideBookings[b.guide_id] ?? []
        guideBookings[b.guide_id].push(b.id)
      }

      res.json({
        tourismUsers: users.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        packageCategories: packageCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
        destinations,
        packages,
        bookings: bookings.map(mapBooking),
        payments: payments.map((r) => ({
          id: r.id,
          bookingId: r.booking_id,
          amountRwf: Number(r.amount_rwf),
          status: r.status,
          method: r.method,
          reference: r.reference,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        messages: messages.map((r) => ({
          id: r.id,
          source: r.source,
          name: r.name,
          email: r.email,
          subject: r.subject,
          body: r.body,
          read: !!r.read_flag,
          createdAt: new Date(r.created_at).toISOString(),
        })),
        carRentalRequests: carRentalRows.map((r) => {
          const pd =
            typeof r.pickup_date === 'string'
              ? r.pickup_date.slice(0, 10)
              : new Date(r.pickup_date).toISOString().slice(0, 10)
          const rd =
            typeof r.return_date === 'string'
              ? r.return_date.slice(0, 10)
              : new Date(r.return_date).toISOString().slice(0, 10)
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            vehicleClass: r.vehicle_class,
            pickupDate: pd,
            returnDate: rd,
            pickupLocation: r.pickup_location ?? '',
            returnLocation: r.return_location ?? '',
            driverOption: r.driver_option,
            extras: parseJson(r.extras_json, {}),
            message: r.message ?? '',
            status: r.status,
            adminNotes: r.admin_notes ?? '',
            read: !!r.read_flag,
            createdAt: new Date(r.created_at).toISOString(),
          }
        }),
        carRentalVehicles: carRentalVehicleRows.map((r) => mapCarRentalVehicle(r)),
        reviews: reviews.map((r) => {
          const authorName = String(r.author_name ?? '').trim()
          return {
            id: r.id,
            userId: r.user_id,
            packageId: r.package_id,
            authorName,
            authorCountry: r.author_country ?? '',
            photoUrl: r.photo_url ?? '',
            rating: r.rating,
            comment: r.comment,
            status: r.status,
            featured: !!r.featured,
            createdAt: new Date(r.created_at).toISOString(),
          }
        }),
        blogCategories: blogCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          body: p.body,
          categoryId: p.category_id,
          coverImageUrl: p.cover_image_url,
          published: !!p.published,
          updatedAt: new Date(p.updated_at).toISOString(),
        })),
        gallery: gallery.map((g) => ({
          id: g.id,
          url: g.url,
          type: g.type,
          category: g.category,
          caption: g.caption,
          updatedAt: new Date(g.updated_at).toISOString(),
        })),
        guides: guides.map((g) => ({
          id: g.id,
          userId: g.user_id,
          languages: parseJson(g.languages, []),
          bio: g.bio,
          availability: g.availability,
          activeBookingIds: guideBookings[g.id] ?? [],
          updatedAt: new Date(g.updated_at).toISOString(),
        })),
        tourBookingRequests: tourBookingRows.map(mapTourBookingRequest),
        monthlyMetrics: resolveMonthlyMetrics(monthlyMetricRows, bookings, payments),
        dashboardSummary: buildDashboardSummary({
          rawBookings: bookings,
          rawPayments: payments,
          messages,
          reviews,
          carRentalRequests: carRentalRows,
          tourBookingRequests: tourBookingRows,
          destinations,
          packages,
          carRentalVehicles: carRentalVehicleRows,
          posts,
          gallery,
          heroSlides: heroSlideRows,
          pricingPlans: pricingPlanRows,
          tourismUsers: users,
        }),
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          read: !!n.read_flag,
          createdAt: new Date(n.created_at).toISOString(),
        })),
        activityLogs: activityLogs.map((a) => ({
          id: a.id,
          actor: a.actor,
          action: a.action,
          entity: a.entity,
          at: new Date(a.at).toISOString(),
        })),
        roleDefinitions: roleDefinitions.map((r) => ({
          id: r.id,
          label: r.label,
          permissions: parseJson(r.permissions, []),
        })),
        settings,
        adminSettings,
      })
    } catch (e) {
      next(e)
    }
  })
}
