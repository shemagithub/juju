/** Seed testimonials shown on Home & About when the reviews table is empty. */
export const GUEST_REVIEW_USER_ID = 'a0000000-0000-4000-8000-000000000001'

export const DEFAULT_REVIEWS = [
  {
    authorName: 'Sarah Johnson',
    authorCountry: 'USA',
    rating: 5,
    comment:
      'Rwanda Quest Tours made our gorilla trekking dream come true. Professional, safe, and an unforgettable experience!',
    status: 'approved',
    featured: true,
  },
  {
    authorName: 'Michael Chen',
    authorCountry: 'Singapore',
    rating: 5,
    comment:
      'Excellent service from start to finish. The team was knowledgeable and the gorilla permit process was seamless.',
    status: 'approved',
    featured: true,
  },
  {
    authorName: 'Emma Williams',
    authorCountry: 'UK',
    rating: 5,
    comment:
      'Best travel experience in Rwanda. Highly recommend for anyone visiting the country. Truly professional!',
    status: 'approved',
    featured: false,
  },
]
