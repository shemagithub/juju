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
import type { DestinationFormValue } from './destination-detail-form.shared'

type Props = {
  value: DestinationFormValue
  onChange: (v: DestinationFormValue) => void
  packages: { id: string; title: string }[]
}

export function DestinationDetailForm({ value, onChange, packages }: Props) {
  const set = <K extends keyof DestinationFormValue>(key: K, val: DestinationFormValue[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className='space-y-6'>
      <section className='space-y-4'>
        <h3 className='text-sm font-semibold'>Basic info</h3>
        <div className='space-y-2'>
          <Label>Name</Label>
          <Input value={value.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Slug</Label>
            <Input value={value.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label>Category</Label>
            <Select value={value.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='parks'>National Parks</SelectItem>
                <SelectItem value='cities'>Cities</SelectItem>
                <SelectItem value='lakes'>Lakes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='space-y-2'>
          <Label>Description</Label>
          <Textarea
            value={value.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
          />
        </div>
        <ImagesUploader
          label='Hero images'
          value={value.imageUrls}
          onChange={(urls) => set('imageUrls', urls)}
          required
        />
      </section>

      <section className='space-y-4'>
        <h3 className='text-sm font-semibold'>Travel info (modal quick bar)</h3>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Location</Label>
            <Input
              placeholder='Northern Province, Rwanda'
              value={value.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Distance / travel time</Label>
            <Input
              placeholder='2.5 hours from Kigali'
              value={value.distance}
              onChange={(e) => set('distance', e.target.value)}
            />
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-4'>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={value.permitRequired}
              onCheckedChange={(c) => set('permitRequired', !!c)}
            />
            Permit required
          </label>
          {value.permitRequired ? (
            <div className='flex items-center gap-2'>
              <Label className='text-sm'>Permit price (USD)</Label>
              <Input
                type='number'
                className='w-28'
                value={value.permitPrice}
                onChange={(e) => set('permitPrice', Number(e.target.value))}
              />
            </div>
          ) : null}
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Best time to visit</Label>
            <Input
              placeholder='June–September, December–February'
              value={value.bestTime}
              onChange={(e) => set('bestTime', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Weather / climate</Label>
            <Input
              placeholder='Mountain climate: 10–20°C'
              value={value.weather}
              onChange={(e) => set('weather', e.target.value)}
            />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Latitude</Label>
            <Input
              type='number'
              step='any'
              value={value.lat}
              onChange={(e) => set('lat', Number(e.target.value))}
            />
          </div>
          <div className='space-y-2'>
            <Label>Longitude</Label>
            <Input
              type='number'
              step='any'
              value={value.lng}
              onChange={(e) => set('lng', Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Highlights</h3>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => set('highlights', [...value.highlights, ''])}
          >
            <Plus className='me-1 size-3' /> Add
          </Button>
        </div>
        {value.highlights.map((h, i) => (
          <div key={i} className='flex gap-2'>
            <Input
              value={h}
              placeholder='Mountain gorilla trekking'
              onChange={(e) => {
                const next = [...value.highlights]
                next[i] = e.target.value
                set('highlights', next)
              }}
            />
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={() => set('highlights', value.highlights.filter((_, j) => j !== i))}
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        ))}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Activities</h3>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              set('activities', [...value.activities, { name: '', icon: '', description: '' }])
            }
          >
            <Plus className='me-1 size-3' /> Add
          </Button>
        </div>
        {value.activities.map((act, i) => (
          <div key={i} className='space-y-2 rounded-md border p-3'>
            <div className='grid gap-2 sm:grid-cols-3'>
              <Input
                placeholder='Name'
                value={act.name}
                onChange={(e) => {
                  const next = [...value.activities]
                  next[i] = { ...next[i], name: e.target.value }
                  set('activities', next)
                }}
              />
              <Input
                placeholder='Icon (emoji)'
                value={act.icon}
                onChange={(e) => {
                  const next = [...value.activities]
                  next[i] = { ...next[i], icon: e.target.value }
                  set('activities', next)
                }}
              />
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className='justify-self-end'
                onClick={() => set('activities', value.activities.filter((_, j) => j !== i))}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
            <Textarea
              placeholder='Short description'
              rows={2}
              value={act.description}
              onChange={(e) => {
                const next = [...value.activities]
                next[i] = { ...next[i], description: e.target.value }
                set('activities', next)
              }}
            />
          </div>
        ))}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Reviews</h3>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              set('reviews', [...value.reviews, { name: '', rating: 5, comment: '' }])
            }
          >
            <Plus className='me-1 size-3' /> Add
          </Button>
        </div>
        {value.reviews.map((rev, i) => (
          <div key={i} className='space-y-2 rounded-md border p-3'>
            <div className='grid gap-2 sm:grid-cols-3'>
              <Input
                placeholder='Guest name'
                value={rev.name}
                onChange={(e) => {
                  const next = [...value.reviews]
                  next[i] = { ...next[i], name: e.target.value }
                  set('reviews', next)
                }}
              />
              <Input
                type='number'
                min={1}
                max={5}
                placeholder='Rating 1-5'
                value={rev.rating}
                onChange={(e) => {
                  const next = [...value.reviews]
                  next[i] = { ...next[i], rating: Number(e.target.value) }
                  set('reviews', next)
                }}
              />
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className='justify-self-end'
                onClick={() => set('reviews', value.reviews.filter((_, j) => j !== i))}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
            <Textarea
              placeholder='Review comment'
              rows={2}
              value={rev.comment}
              onChange={(e) => {
                const next = [...value.reviews]
                next[i] = { ...next[i], comment: e.target.value }
                set('reviews', next)
              }}
            />
          </div>
        ))}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>FAQs (modal accordion)</h3>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => set('faqs', [...value.faqs, { question: '', answer: '' }])}
          >
            <Plus className='me-1 size-3' /> Add
          </Button>
        </div>
        {value.faqs.map((faq, i) => (
          <div key={i} className='space-y-2 rounded-md border p-3'>
            <Input
              placeholder='Question'
              value={faq.question}
              onChange={(e) => {
                const next = [...value.faqs]
                next[i] = { ...next[i], question: e.target.value }
                set('faqs', next)
              }}
            />
            <Textarea
              placeholder='Answer'
              rows={2}
              value={faq.answer}
              onChange={(e) => {
                const next = [...value.faqs]
                next[i] = { ...next[i], answer: e.target.value }
                set('faqs', next)
              }}
            />
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => set('faqs', value.faqs.filter((_, j) => j !== i))}
            >
              <Trash2 className='me-4 size-4' /> Remove FAQ
            </Button>
          </div>
        ))}
      </section>

      <section className='space-y-2'>
        <Label>Linked packages</Label>
        <div className='bg-muted/40 max-h-36 space-y-2 overflow-y-auto rounded-md border p-2'>
          {packages.map((p) => (
            <label key={p.id} className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={value.linkedPackageIds.includes(p.id)}
                onChange={(e) => {
                  const setIds = new Set(value.linkedPackageIds)
                  if (e.target.checked) setIds.add(p.id)
                  else setIds.delete(p.id)
                  set('linkedPackageIds', [...setIds])
                }}
              />
              {p.title}
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
