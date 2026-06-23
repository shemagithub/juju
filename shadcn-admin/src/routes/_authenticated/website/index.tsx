import { createFileRoute } from '@tanstack/react-router'
import { TourismWebsitePagesView } from '@/features/tourism/views/website-pages-view'

export const Route = createFileRoute('/_authenticated/website/')({
  component: TourismWebsitePagesView,
})
