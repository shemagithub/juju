export type DestinationActivity = {
  name: string
  icon: string
  description: string
}

export type DestinationReview = {
  name: string
  rating: number
  comment: string
}

export type DestinationFaq = {
  question: string
  answer: string
}

export type DestinationFormValue = {
  name: string
  slug: string
  description: string
  imageUrls: string[]
  lat: number
  lng: number
  category: string
  location: string
  distance: string
  permitRequired: boolean
  permitPrice: number
  highlights: string[]
  activities: DestinationActivity[]
  bestTime: string
  weather: string
  reviews: DestinationReview[]
  faqs: DestinationFaq[]
  linkedPackageIds: string[]
}

export const emptyDestinationForm = (): DestinationFormValue => ({
  name: '',
  slug: '',
  description: '',
  imageUrls: [],
  lat: -1.94,
  lng: 29.87,
  category: 'parks',
  location: '',
  distance: '',
  permitRequired: false,
  permitPrice: 0,
  highlights: [''],
  activities: [{ name: '', icon: '', description: '' }],
  bestTime: '',
  weather: '',
  reviews: [{ name: '', rating: 5, comment: '' }],
  faqs: [
    { question: 'Is this destination safe to visit?', answer: '' },
    { question: 'How many days should I spend here?', answer: '' },
  ],
  linkedPackageIds: [],
})

export function sanitizeDestinationPayload(v: DestinationFormValue) {
  return {
    name: v.name,
    slug: v.slug,
    description: v.description,
    lat: Number(v.lat),
    lng: Number(v.lng),
    imageUrls: v.imageUrls ?? [],
    category: v.category,
    location: v.location,
    distance: v.distance,
    permitRequired: v.permitRequired,
    permitPrice: Number(v.permitPrice),
    highlights: (v.highlights ?? []).map((s) => s.trim()).filter(Boolean),
    activities: (v.activities ?? []).filter((a) => a.name.trim()),
    bestTime: v.bestTime,
    weather: v.weather,
    reviews: (v.reviews ?? []).filter((r) => r.name.trim() && r.comment.trim()),
    faqs: (v.faqs ?? []).filter((f) => f.question.trim() && f.answer.trim()),
    linkedPackageIds: v.linkedPackageIds ?? [],
  }
}
