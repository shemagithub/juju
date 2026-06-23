export type CarRentalVehicleSpec = { icon?: string; text?: string }

export type CarRentalVehicleFormValue = {
  id: string
  slug: string
  title: string
  vehicleName: string
  brand: string
  model: string
  year: string
  category: string
  badge: string
  blurb: string
  description: string
  transmission: string
  fuelType: string
  engineCapacity: string
  seats: string
  doors: string
  airConditioning: boolean
  luggageCapacity: string
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  driverFee: number
  deposit: number
  status: string
  plateNumber: string
  registrationExpiry: string
  insuranceExpiry: string
  pickupLocations: string[]
  deliveryAvailable: boolean
  deliveryFee: number
  featured: boolean
  driverIncluded: boolean
  driverLanguages: string[]
  airportTransferVehicle: boolean
  touristSafariVehicle: boolean
  selfDriveAvailable: boolean
  unlimitedMileageOption: boolean
  gpsInstalled: boolean
  popularBadge: boolean
  galleryUrls: string[]
  specs: CarRentalVehicleSpec[]
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type CarRentalVehicleDto = CarRentalVehicleFormValue & {
  dailyPriceUsd?: number
  imageUrl?: string
}

export const emptyCarRentalVehicleForm = (): CarRentalVehicleFormValue => ({
  id: '',
  slug: '',
  title: '',
  vehicleName: '',
  brand: '',
  model: '',
  year: '',
  category: 'economy',
  badge: '',
  blurb: '',
  description: '',
  transmission: 'Automatic',
  fuelType: 'Petrol',
  engineCapacity: '',
  seats: '',
  doors: '',
  airConditioning: true,
  luggageCapacity: '',
  dailyRate: 0,
  weeklyRate: 0,
  monthlyRate: 0,
  driverFee: 0,
  deposit: 0,
  status: 'available',
  plateNumber: '',
  registrationExpiry: '',
  insuranceExpiry: '',
  pickupLocations: ['Kigali International Airport', 'Kigali city hotels'],
  deliveryAvailable: false,
  deliveryFee: 0,
  featured: false,
  driverIncluded: false,
  driverLanguages: ['English', 'Kinyarwanda', 'French'],
  airportTransferVehicle: false,
  touristSafariVehicle: false,
  selfDriveAvailable: true,
  unlimitedMileageOption: false,
  gpsInstalled: false,
  popularBadge: false,
  galleryUrls: [],
  specs: [
    { icon: 'bi-people', text: '5 seats' },
    { icon: 'bi-fuel-pump', text: 'Petrol' },
    { icon: 'bi-gear', text: 'Automatic' },
  ],
  active: true,
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
})

export function vehicleDtoToForm(v: CarRentalVehicleDto): CarRentalVehicleFormValue {
  const gallery = v.galleryUrls?.length
    ? v.galleryUrls
    : v.imageUrl
      ? [v.imageUrl]
      : []
  return {
    id: v.id ?? '',
    slug: v.slug ?? '',
    title: v.title ?? '',
    vehicleName: v.vehicleName ?? v.title ?? '',
    brand: v.brand ?? '',
    model: v.model ?? '',
    year: v.year == null ? '' : String(v.year),
    category: v.category ?? '',
    badge: v.badge ?? '',
    blurb: v.blurb ?? '',
    description: v.description ?? v.blurb ?? '',
    transmission: v.transmission ?? '',
    fuelType: v.fuelType ?? '',
    engineCapacity: v.engineCapacity ?? '',
    seats: v.seats == null ? '' : String(v.seats),
    doors: v.doors == null ? '' : String(v.doors),
    airConditioning: v.airConditioning ?? true,
    luggageCapacity: v.luggageCapacity ?? '',
    dailyRate: Number(v.dailyRate ?? v.dailyPriceUsd ?? 0),
    weeklyRate: Number(v.weeklyRate ?? 0),
    monthlyRate: Number(v.monthlyRate ?? 0),
    driverFee: Number(v.driverFee ?? 0),
    deposit: Number(v.deposit ?? 0),
    status: v.status ?? 'available',
    plateNumber: v.plateNumber ?? '',
    registrationExpiry: v.registrationExpiry ?? '',
    insuranceExpiry: v.insuranceExpiry ?? '',
    pickupLocations: v.pickupLocations?.length ? [...v.pickupLocations] : [''],
    deliveryAvailable: !!v.deliveryAvailable,
    deliveryFee: Number(v.deliveryFee ?? 0),
    featured: !!v.featured,
    driverIncluded: !!v.driverIncluded,
    driverLanguages: v.driverLanguages?.length ? [...v.driverLanguages] : [''],
    airportTransferVehicle: !!v.airportTransferVehicle,
    touristSafariVehicle: !!v.touristSafariVehicle,
    selfDriveAvailable: v.selfDriveAvailable ?? true,
    unlimitedMileageOption: !!v.unlimitedMileageOption,
    gpsInstalled: !!v.gpsInstalled,
    popularBadge: !!v.popularBadge,
    galleryUrls: gallery,
    specs: v.specs?.length ? [...v.specs] : [],
    active: !!v.active,
    sortOrder: Number(v.sortOrder ?? 0),
    createdAt: v.createdAt ?? '',
    updatedAt: v.updatedAt ?? '',
  }
}

export function vehicleFormToPayload(v: CarRentalVehicleFormValue) {
  return {
    slug: v.slug,
    title: v.title,
    vehicleName: v.vehicleName,
    brand: v.brand,
    model: v.model,
    year: v.year ? Number(v.year) : null,
    category: v.category,
    badge: v.badge,
    blurb: v.blurb,
    description: v.description,
    transmission: v.transmission,
    fuelType: v.fuelType,
    engineCapacity: v.engineCapacity,
    seats: v.seats ? Number(v.seats) : null,
    doors: v.doors ? Number(v.doors) : null,
    airConditioning: v.airConditioning,
    luggageCapacity: v.luggageCapacity,
    dailyRate: v.dailyRate,
    weeklyRate: v.weeklyRate,
    monthlyRate: v.monthlyRate,
    driverFee: v.driverFee,
    deposit: v.deposit,
    status: v.status,
    plateNumber: v.plateNumber,
    registrationExpiry: v.registrationExpiry || null,
    insuranceExpiry: v.insuranceExpiry || null,
    pickupLocations: v.pickupLocations.map((x) => x.trim()).filter(Boolean),
    deliveryAvailable: v.deliveryAvailable,
    deliveryFee: v.deliveryFee,
    featured: v.featured,
    driverIncluded: v.driverIncluded,
    driverLanguages: v.driverLanguages.map((x) => x.trim()).filter(Boolean),
    airportTransferVehicle: v.airportTransferVehicle,
    touristSafariVehicle: v.touristSafariVehicle,
    selfDriveAvailable: v.selfDriveAvailable,
    unlimitedMileageOption: v.unlimitedMileageOption,
    gpsInstalled: v.gpsInstalled,
    popularBadge: v.popularBadge,
    galleryUrls: v.galleryUrls,
    specs: v.specs,
    active: v.active,
    sortOrder: v.sortOrder,
  }
}
