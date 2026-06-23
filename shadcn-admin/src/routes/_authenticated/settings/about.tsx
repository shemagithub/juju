import { createFileRoute } from '@tanstack/react-router'
import { TourismAboutSettingsPage } from '@/features/tourism/views/about-settings-view'

export const Route = createFileRoute('/_authenticated/settings/about')({
  component: TourismAboutSettingsPage,
})
