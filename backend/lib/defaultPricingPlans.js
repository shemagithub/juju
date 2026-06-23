export const DEFAULT_PRICING_SECTION = {
  eyebrow: 'Packages',
  title: 'Prices For Rwanda Adventures',
  backgroundUrl: '',
  currency: '$',
  priceUnit: '/person',
  ctaLabel: 'Book Now',
  ctaLink: '/book',
}

export const DEFAULT_PRICING_PLANS = [
  {
    name: 'Basic Travel',
    priceUsd: 499,
    features: ['3 Days Tour', '5 Nights Stay', 'Breakfast Included', 'Tour Guide', 'Transport'],
    popular: false,
    sortOrder: 0,
  },
  {
    name: 'Standard Travel',
    priceUsd: 899,
    features: [
      '5 Days Tour',
      '7 Nights Stay',
      'All Meals',
      'Expert Guide',
      'Permits Included',
      'Airport Transfer',
    ],
    popular: true,
    sortOrder: 1,
  },
  {
    name: 'Premium Travel',
    priceUsd: 1499,
    features: [
      '7 Days Tour',
      '10 Nights Stay',
      'Luxury Lodges',
      'Private Guide',
      'All Permits',
      'VIP Transfer',
    ],
    popular: false,
    sortOrder: 2,
  },
]
