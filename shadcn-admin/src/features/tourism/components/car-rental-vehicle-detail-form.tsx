import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImagesUploader } from '@/components/shared/image-uploader'
import type { CarRentalVehicleFormValue } from '../types/car-rental-vehicle'
import { useCarRentalVehicleCategoriesQuery } from '../hooks/use-tourism-queries'

type Props = {
  value: CarRentalVehicleFormValue
  onChange: (v: CarRentalVehicleFormValue) => void
  isEdit?: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='space-y-4 rounded-lg border p-4'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      {children}
    </section>
  )
}

function FlagRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      <Label htmlFor={id} className='font-normal'>
        {label}
      </Label>
    </div>
  )
}

export function CarRentalVehicleDetailForm({ value, onChange, isEdit }: Props) {
  const { data: categories = [] } = useCarRentalVehicleCategoriesQuery(true)
  const categoryOptions =
    categories.length > 0
      ? categories.filter((c) => c.active)
      : [
          { slug: 'economy', name: 'Economy' },
          { slug: 'suv', name: 'SUV' },
          { slug: 'safari', name: 'Safari 4×4' },
          { slug: 'luxury', name: 'Luxury' },
          { slug: 'van', name: 'Van / Minibus' },
          { slug: 'pickup', name: 'Pickup' },
        ]

  const set = <K extends keyof CarRentalVehicleFormValue>(key: K, val: CarRentalVehicleFormValue[K]) =>
    onChange({ ...value, [key]: val })

  const updateList = (key: 'pickupLocations' | 'driverLanguages', idx: number, text: string) => {
    const next = [...value[key]]
    next[idx] = text
    set(key, next)
  }

  const removeListItem = (key: 'pickupLocations' | 'driverLanguages', idx: number) => {
    const next = value[key].filter((_, i) => i !== idx)
    set(key, next.length ? next : [''])
  }

  const addListItem = (key: 'pickupLocations' | 'driverLanguages') => {
    set(key, [...value[key], ''])
  }

  const updateSpec = (idx: number, field: 'icon' | 'text', text: string) => {
    const next = [...value.specs]
    next[idx] = { ...next[idx], [field]: text }
    set('specs', next)
  }

  return (
    <div className='space-y-6'>
      <Section title='Identity & catalog'>
        {isEdit && value.id ? (
          <div className='space-y-2'>
            <Label>ID</Label>
            <Input value={value.id} readOnly className='font-mono text-xs' />
          </div>
        ) : null}
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Slug *</Label>
            <Input
              value={value.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder='economy'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label>Sort order</Label>
            <Input
              type='number'
              value={value.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value || 0))}
            />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Catalog title *</Label>
            <Input
              value={value.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder='Economy'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label>Vehicle name *</Label>
            <Input
              value={value.vehicleName}
              onChange={(e) => set('vehicleName', e.target.value)}
              placeholder='Toyota Yaris 1.5 Hybrid'
              required
            />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Brand</Label>
            <Input value={value.brand} onChange={(e) => set('brand', e.target.value)} placeholder='Toyota' />
          </div>
          <div className='space-y-2'>
            <Label>Model</Label>
            <Input value={value.model} onChange={(e) => set('model', e.target.value)} placeholder='RAV4' />
          </div>
          <div className='space-y-2'>
            <Label>Year</Label>
            <Input
              type='number'
              min={1990}
              max={2035}
              value={value.year}
              onChange={(e) => set('year', e.target.value)}
              placeholder='2022'
            />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Category</Label>
            <Select value={value.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Badge</Label>
            <Input
              value={value.badge}
              onChange={(e) => set('badge', e.target.value)}
              placeholder='City & airport'
            />
          </div>
          <div className='space-y-2'>
            <Label>Fleet status</Label>
            <Select value={value.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='available'>Available</SelectItem>
                <SelectItem value='rented'>Rented</SelectItem>
                <SelectItem value='maintenance'>Maintenance</SelectItem>
                <SelectItem value='retired'>Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isEdit ? (
          <div className='text-muted-foreground grid gap-2 text-xs sm:grid-cols-2'>
            <p>Created: {value.createdAt ? new Date(value.createdAt).toLocaleString() : '—'}</p>
            <p>Updated: {value.updatedAt ? new Date(value.updatedAt).toLocaleString() : '—'}</p>
          </div>
        ) : null}
      </Section>

      <Section title='Description'>
        <div className='space-y-2'>
          <Label>Short blurb (card)</Label>
          <Textarea rows={2} value={value.blurb} onChange={(e) => set('blurb', e.target.value)} />
        </div>
        <div className='space-y-2'>
          <Label>Full description (detail page)</Label>
          <Textarea rows={6} value={value.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </Section>

      <Section title='Vehicle specifications'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Transmission</Label>
            <Select value={value.transmission} onValueChange={(v) => set('transmission', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Automatic'>Automatic</SelectItem>
                <SelectItem value='Manual'>Manual</SelectItem>
                <SelectItem value='CVT'>CVT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Fuel type</Label>
            <Select value={value.fuelType} onValueChange={(v) => set('fuelType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Petrol'>Petrol</SelectItem>
                <SelectItem value='Diesel'>Diesel</SelectItem>
                <SelectItem value='Hybrid'>Hybrid</SelectItem>
                <SelectItem value='Electric'>Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Engine capacity</Label>
            <Input
              value={value.engineCapacity}
              onChange={(e) => set('engineCapacity', e.target.value)}
              placeholder='2.5L / 1.5L Hybrid'
            />
          </div>
          <div className='space-y-2'>
            <Label>Seats</Label>
            <Input
              type='number'
              min={1}
              value={value.seats}
              onChange={(e) => set('seats', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Doors</Label>
            <Input
              type='number'
              min={2}
              value={value.doors}
              onChange={(e) => set('doors', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Luggage capacity</Label>
            <Input
              value={value.luggageCapacity}
              onChange={(e) => set('luggageCapacity', e.target.value)}
              placeholder='4 large bags'
            />
          </div>
        </div>
        <FlagRow
          id='air-conditioning'
          label='Air conditioning'
          checked={value.airConditioning}
          onChange={(v) => set('airConditioning', v)}
        />
      </Section>

      <Section title='Pricing (USD)'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Daily rate *</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.dailyRate}
              onChange={(e) => set('dailyRate', Number(e.target.value || 0))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Weekly rate</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.weeklyRate}
              onChange={(e) => set('weeklyRate', Number(e.target.value || 0))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Monthly rate</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.monthlyRate}
              onChange={(e) => set('monthlyRate', Number(e.target.value || 0))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Driver fee (per day)</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.driverFee}
              onChange={(e) => set('driverFee', Number(e.target.value || 0))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Security deposit</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.deposit}
              onChange={(e) => set('deposit', Number(e.target.value || 0))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Delivery fee</Label>
            <Input
              type='number'
              min={0}
              step='0.01'
              value={value.deliveryFee}
              onChange={(e) => set('deliveryFee', Number(e.target.value || 0))}
            />
          </div>
        </div>
      </Section>

      <Section title='Registration & compliance'>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Plate number</Label>
            <Input
              value={value.plateNumber}
              onChange={(e) => set('plateNumber', e.target.value)}
              placeholder='RAD 123 A'
            />
          </div>
          <div className='space-y-2'>
            <Label>Registration expiry</Label>
            <Input
              type='date'
              value={value.registrationExpiry}
              onChange={(e) => set('registrationExpiry', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Insurance expiry</Label>
            <Input
              type='date'
              value={value.insuranceExpiry}
              onChange={(e) => set('insuranceExpiry', e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section title='Pickup & delivery'>
        <div className='space-y-2'>
          <Label>Pickup locations</Label>
          {value.pickupLocations.map((loc, idx) => (
            <div key={`pickup-${idx}`} className='flex gap-2'>
              <Input
                value={loc}
                onChange={(e) => updateList('pickupLocations', idx, e.target.value)}
                placeholder='Kigali International Airport'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeListItem('pickupLocations', idx)}
                aria-label='Remove location'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          ))}
          <Button type='button' variant='outline' size='sm' onClick={() => addListItem('pickupLocations')}>
            <Plus className='me-1 size-4' />
            Add location
          </Button>
        </div>
        <FlagRow
          id='delivery-available'
          label='Delivery available'
          checked={value.deliveryAvailable}
          onChange={(v) => set('deliveryAvailable', v)}
        />
      </Section>

      <Section title='Driver & vehicle options'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <FlagRow
            id='driver-included'
            label='Driver included'
            checked={value.driverIncluded}
            onChange={(v) => set('driverIncluded', v)}
          />
          <FlagRow
            id='self-drive'
            label='Self-drive available'
            checked={value.selfDriveAvailable}
            onChange={(v) => set('selfDriveAvailable', v)}
          />
          <FlagRow
            id='airport-transfer'
            label='Airport transfer vehicle'
            checked={value.airportTransferVehicle}
            onChange={(v) => set('airportTransferVehicle', v)}
          />
          <FlagRow
            id='safari-vehicle'
            label='Tourist safari vehicle'
            checked={value.touristSafariVehicle}
            onChange={(v) => set('touristSafariVehicle', v)}
          />
          <FlagRow
            id='unlimited-mileage'
            label='Unlimited mileage option'
            checked={value.unlimitedMileageOption}
            onChange={(v) => set('unlimitedMileageOption', v)}
          />
          <FlagRow
            id='gps-installed'
            label='GPS / vehicle tracking installed'
            checked={value.gpsInstalled}
            onChange={(v) => set('gpsInstalled', v)}
          />
        </div>
        <div className='space-y-2'>
          <Label>Driver languages</Label>
          {value.driverLanguages.map((lang, idx) => (
            <div key={`lang-${idx}`} className='flex gap-2'>
              <Input
                value={lang}
                onChange={(e) => updateList('driverLanguages', idx, e.target.value)}
                placeholder='English'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeListItem('driverLanguages', idx)}
                aria-label='Remove language'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          ))}
          <Button type='button' variant='outline' size='sm' onClick={() => addListItem('driverLanguages')}>
            <Plus className='me-1 size-4' />
            Add language
          </Button>
        </div>
      </Section>

      <Section title='Public site display'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <FlagRow
            id='active-catalog'
            label='Visible on public catalog'
            checked={value.active}
            onChange={(v) => set('active', v)}
          />
          <FlagRow
            id='featured-vehicle'
            label='Featured vehicle'
            checked={value.featured}
            onChange={(v) => set('featured', v)}
          />
          <FlagRow
            id='popular-badge'
            label='Popular vehicle badge'
            checked={value.popularBadge}
            onChange={(v) => set('popularBadge', v)}
          />
        </div>
        <ImagesUploader
          label='Vehicle images (gallery)'
          value={value.galleryUrls}
          onChange={(urls) => set('galleryUrls', urls)}
          required
        />
      </Section>

      <Section title='Card specs (icons on travel site)'>
        <p className='text-muted-foreground text-xs'>
          Shown on car cards. Use Bootstrap icon names (e.g. <code>bi-people</code>).
        </p>
        {value.specs.map((spec, idx) => (
          <div key={`spec-${idx}`} className='flex flex-wrap gap-2'>
            <Input
              className='w-36 font-mono text-xs'
              value={spec.icon ?? ''}
              onChange={(e) => updateSpec(idx, 'icon', e.target.value)}
              placeholder='bi-people'
            />
            <Input
              className='min-w-[200px] flex-1'
              value={spec.text ?? ''}
              onChange={(e) => updateSpec(idx, 'text', e.target.value)}
              placeholder='5 seats'
            />
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={() => set('specs', value.specs.filter((_, i) => i !== idx))}
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        ))}
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => set('specs', [...value.specs, { icon: 'bi-circle', text: '' }])}
        >
          <Plus className='me-1 size-4' />
          Add spec row
        </Button>
      </Section>
    </div>
  )
}
