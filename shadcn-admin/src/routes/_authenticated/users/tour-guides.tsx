import { createFileRoute } from '@tanstack/react-router'
import { TourismUsersPage } from '@/features/tourism/pages/tourism-users-page'

export const Route = createFileRoute('/_authenticated/users/tour-guides')({
  component: () => (
    <TourismUsersPage
      segment='guide'
      title='Guides'
      description='People who lead tours.'
    />
  ),
})
