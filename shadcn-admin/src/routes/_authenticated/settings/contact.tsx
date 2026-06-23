import { createFileRoute } from '@tanstack/react-router'
import { TourismSiteSettingsPage } from '@/features/tourism/views/site-settings-view'

export const Route = createFileRoute('/_authenticated/settings/contact')({
  component: () => <TourismSiteSettingsPage section='contact' />,
})
