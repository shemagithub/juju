import { createFileRoute } from '@tanstack/react-router'
import { TourismHeroSlidesPage } from '@/features/tourism/pages/tourism-hero-slides-page'

export const Route = createFileRoute('/_authenticated/website/hero/')({
  component: () => <TourismHeroSlidesPage />,
})
