export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const

export const CAR_RENTAL_STATUSES = [
  'pending',
  'contacted',
  'quoted',
  'confirmed',
  'declined',
  'cancelled',
] as const

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'pending', 'refunded', 'completed'] as const

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const

export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const

export const PACKAGE_STATUSES = ['active', 'inactive', 'draft', 'archived'] as const
