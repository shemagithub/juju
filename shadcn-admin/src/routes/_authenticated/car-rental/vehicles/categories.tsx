import { createFileRoute } from '@tanstack/react-router'
import { TourismCarRentalCategoriesPage } from '@/features/tourism/pages/tourism-car-rental-categories-page'

export const Route = createFileRoute('/_authenticated/car-rental/vehicles/categories')({
  component: () => <TourismCarRentalCategoriesPage />,
})
