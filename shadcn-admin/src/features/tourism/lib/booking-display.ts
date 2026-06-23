const SERVICE_LABELS: Record<string, string> = {
  package: 'Tour package',
  services: 'Services',
  gorilla: 'Gorilla trekking',
  safari: 'Wildlife safari',
  'car-hire': 'Car hire',
  airport: 'Airport transfer',
  hotel: 'Hotel booking',
  custom: 'Custom tour',
  general: 'General inquiry',
}

export function formatServiceType(serviceType: string) {
  const key = String(serviceType || '').trim().toLowerCase()
  return SERVICE_LABELS[key] ?? key.replace(/-/g, ' ')
}

export function paymentFromDetails(details: Record<string, unknown> | undefined) {
  if (!details) return '—'
  const label = details.paymentLabel
  if (typeof label === 'string' && label.trim()) return label.trim()
  const method = details.paymentMethod
  if (typeof method === 'string' && method.trim()) {
    return method.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return '—'
}

export function packageNameFromRow(
  packageId: string | null | undefined,
  details: Record<string, unknown> | undefined,
  resolveTitle: (id: string) => string,
) {
  if (packageId) {
    const title = resolveTitle(packageId)
    if (title && title !== packageId) return title
  }
  const fromDetails = details?.packageName
  if (typeof fromDetails === 'string' && fromDetails.trim()) return fromDetails.trim()
  return '—'
}

export function travelersLabel(adults: number, children: number) {
  const parts: string[] = []
  if (adults > 0) parts.push(`${adults} adult${adults === 1 ? '' : 's'}`)
  if (children > 0) parts.push(`${children} child${children === 1 ? '' : 'ren'}`)
  return parts.length ? parts.join(', ') : '—'
}
