import { createFileRoute } from '@tanstack/react-router'
import { TourismPricingSettingsPage } from '@/features/tourism/views/pricing-settings-view'

export const Route = createFileRoute('/_authenticated/settings/pricing')({
  component: TourismPricingSettingsPage,
})
