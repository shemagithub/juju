import { createFileRoute } from '@tanstack/react-router'
import { TourismHeroSlideFormPage } from '@/features/tourism/pages/tourism-hero-slide-form-page'

export const Route = createFileRoute('/_authenticated/website/hero/$slideId')({
  component: function HeroSlideEditRoute() {
    const { slideId } = Route.useParams()
    return <TourismHeroSlideFormPage slideId={slideId} />
  },
})
