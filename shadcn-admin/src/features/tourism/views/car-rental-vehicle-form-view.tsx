import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { CarRentalVehicleDetailForm } from '../components/car-rental-vehicle-detail-form'
import {
  emptyCarRentalVehicleForm,
  vehicleDtoToForm,
  vehicleFormToPayload,
  type CarRentalVehicleDto,
} from '../types/car-rental-vehicle'

export function TourismCarRentalVehicleFormPage({
  vehicleId,
}: {
  vehicleId?: string
}) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isEdit = Boolean(vehicleId)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyCarRentalVehicleForm)

  useEffect(() => {
    if (!vehicleId) return
    let cancel = false
    setLoading(true)
    void api
      .get<CarRentalVehicleDto>(`/api/car-rental-vehicles/${vehicleId}`)
      .then(({ data }) => {
        if (cancel || !data) throw new Error('not found')
        setForm(vehicleDtoToForm(data))
      })
      .catch((e) => {
        handleServerError(e)
        void navigate({ to: '/car-rental/vehicles', replace: true })
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [vehicleId, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug.trim()) return toast.error('Slug is required')
    if (!form.title.trim()) return toast.error('Catalog title is required')
    if (!form.vehicleName.trim()) return toast.error('Vehicle name is required')
    if (!form.galleryUrls.length) return toast.error('Add at least one image')

    const payload = vehicleFormToPayload(form)
    setSaving(true)
    try {
      if (isEdit && vehicleId) {
        await api.patch(`/api/car-rental-vehicles/${vehicleId}`, payload)
        toast.success('Vehicle saved')
      } else {
        await api.post('/api/car-rental-vehicles', payload)
        toast.success('Vehicle created')
      }
      await qc.invalidateQueries({ queryKey: ['car-rental-vehicles'] })
      await qc.invalidateQueries({ queryKey: ['car-rental-vehicle'] })
      await qc.invalidateQueries({ queryKey: ['car-rental-vehicles-summary'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      void navigate({ to: '/car-rental/vehicles', replace: true })
    } catch (err) {
      handleServerError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TourismAdminShell title='Loading…'>
        <p className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2 className='size-4 animate-spin' /> Loading vehicle…
        </p>
      </TourismAdminShell>
    )
  }

  return (
    <TourismAdminShell
      title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
      description='Complete fleet record for the public Car Rental page and quote requests.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/car-rental/vehicles'>Back to fleet</Link>
        </Button>
      }
    >
      <Card className='max-w-5xl'>
        <CardHeader>
          <CardTitle>Vehicle details</CardTitle>
          <CardDescription>
            Fill identity, specs, pricing, compliance, options, and multiple gallery images. Slug ties to
            booking vehicle class codes on the travel site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className='space-y-6'>
            <CarRentalVehicleDetailForm value={form} onChange={setForm} isEdit={isEdit} />
            <div className='flex gap-2 border-t pt-4'>
              <Button type='submit' disabled={saving}>
                {saving ? <Loader2 className='size-4 animate-spin' /> : null}{' '}
                {isEdit ? 'Save changes' : 'Create vehicle'}
              </Button>
              <Button type='button' variant='outline' asChild>
                <Link to='/car-rental/vehicles'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}
