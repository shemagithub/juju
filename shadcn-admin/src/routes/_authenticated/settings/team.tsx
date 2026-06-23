import { createFileRoute } from '@tanstack/react-router'
import { TourismTeamSettingsPage } from '@/features/tourism/views/team-settings-view'

export const Route = createFileRoute('/_authenticated/settings/team')({
  component: TourismTeamSettingsPage,
})
