import { createFileRoute } from '@tanstack/react-router'
import { TourismLegalSettingsPage } from '@/features/tourism/views/legal-settings-view'

export const Route = createFileRoute('/_authenticated/settings/legal')({
  component: TourismLegalSettingsPage,
})
