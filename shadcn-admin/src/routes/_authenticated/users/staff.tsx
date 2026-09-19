import { createFileRoute } from '@tanstack/react-router'
import { TourismUsersPage } from '@/features/tourism/pages/tourism-users-page'

export const Route = createFileRoute('/_authenticated/users/staff')({
  component: () => (
    <TourismUsersPage
      segment='staff'
      title='Staff / Admins'
      description='People who run the staff desk.'
    />
  ),
})
