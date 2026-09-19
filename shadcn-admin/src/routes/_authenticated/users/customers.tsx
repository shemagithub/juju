import { createFileRoute } from '@tanstack/react-router'
import { TourismUsersSegmentPage } from '@/features/tourism/views/users-segment-view'

export const Route = createFileRoute('/_authenticated/users/customers')({
  component: () => (
    <TourismUsersSegmentPage
      segment='customer'
      title='Customers'
      description='People who booked or signed up.'
    />
  ),
})
