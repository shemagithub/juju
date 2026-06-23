import { createFileRoute } from '@tanstack/react-router'
import { TourismTourBookingRequestsPage } from '@/features/tourism/views/tour-booking-requests-view'

export const Route = createFileRoute('/_authenticated/bookings/tour-requests')({
  component: TourismTourBookingRequestsPage,
})
