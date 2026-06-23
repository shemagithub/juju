import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Plus, RefreshCw, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { resolveAssetUrl } from '@/lib/asset-url'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ImageUploader } from '@/components/shared/image-uploader'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { usePricingQuery, useSiteSettingsQuery } from '../hooks/use-tourism-queries'

type PricingSection = {
  eyebrow: string
  title: string
  backgroundUrl: string
  currency: string
  priceUnit: string
  ctaLabel: string
  ctaLink: string
}

type PricingPlan = {
  id: string
  name: string
  priceUsd: number
  features: string[]
  popular: boolean
  active: boolean
  sortOrder: number
}

type SectionForm = PricingSection

type PlanForm = {
  name: string
  priceUsd: string
  featuresText: string
  popular: boolean
  active: boolean
  sortOrder: string
}

const emptySection = (): SectionForm => ({
  eyebrow: 'Packages',
  title: 'Prices For Rwanda Adventures',
  backgroundUrl: '',
  currency: '$',
  priceUnit: '/person',
  ctaLabel: 'Book Now',
  ctaLink: '/book',
})

const emptyPlanForm = (): PlanForm => ({
  name: '',
  priceUsd: '',
  featuresText: '',
  popular: false,
  active: true,
  sortOrder: '0',
})

function readPlanForm(plan?: PricingPlan | null): PlanForm {
  if (!plan) return emptyPlanForm()
  return {
    name: plan.name,
    priceUsd: String(plan.priceUsd ?? ''),
    featuresText: (plan.features ?? []).join('\n'),
    popular: plan.popular,
    active: plan.active,
    sortOrder: String(plan.sortOrder ?? 0),
  }
}

function parseFeatures(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function TourismPricingSettingsPage() {
  const qc = useQueryClient()
  const { data, isPending, refetch, isFetching } = usePricingQuery()
  const { data: settings = {} } = useSiteSettingsQuery()
  const publicBase = String(
    (settings as Record<string, string>).publicSiteUrl ?? 'http://localhost:3000',
  ).replace(/\/$/, '')

  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySection())
  const [sectionSaving, setSectionSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingPlan | null>(null)
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm())
  const [planSaving, setPlanSaving] = useState(false)
  const [deletePlan, setDeletePlan] = useState<PricingPlan | null>(null)
  const [deleting, setDeleting] = useState(false)

  const section = (data?.section ?? emptySection()) as PricingSection
  const plans = [...((data?.plans ?? []) as PricingPlan[])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )

  useEffect(() => {
    if (data?.section) {
      setSectionForm({ ...emptySection(), ...data.section })
    }
  }, [data?.section])

  const saveSection = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSectionSaving(true)
    try {
      await api.patch('/api/pricing/section', sectionForm)
      toast.success('Pricing section updated')
      await qc.invalidateQueries({ queryKey: ['pricing'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setSectionSaving(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setPlanForm(emptyPlanForm())
    setDialogOpen(true)
  }

  const openEdit = (plan: PricingPlan) => {
    setEditing(plan)
    setPlanForm(readPlanForm(plan))
    setDialogOpen(true)
  }

  const savePlan = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const name = planForm.name.trim()
    const priceUsd = Number(planForm.priceUsd)
    const features = parseFeatures(planForm.featuresText)
    if (!name) {
      toast.error('Plan name is required')
      return
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      toast.error('Enter a valid price')
      return
    }
    if (!features.length) {
      toast.error('Add at least one feature (one per line)')
      return
    }

    setPlanSaving(true)
    try {
      const payload = {
        name,
        priceUsd,
        features,
        popular: planForm.popular,
        active: planForm.active,
        sortOrder: Number(planForm.sortOrder) || 0,
      }
      if (editing) {
        await api.patch(`/api/pricing-plans/${editing.id}`, payload)
        toast.success('Plan updated')
      } else {
        await api.post('/api/pricing-plans', payload)
        toast.success('Plan added')
      }
      setDialogOpen(false)
      setEditing(null)
      setPlanForm(emptyPlanForm())
      await qc.invalidateQueries({ queryKey: ['pricing'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setPlanSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deletePlan) return
    setDeleting(true)
    try {
      await api.delete(`/api/pricing-plans/${deletePlan.id}`)
      toast.success('Plan removed')
      setDeletePlan(null)
      await qc.invalidateQueries({ queryKey: ['pricing'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (plan: PricingPlan) => {
    try {
      await api.patch(`/api/pricing-plans/${plan.id}`, { active: !plan.active })
      toast.success(plan.active ? 'Plan hidden from site' : 'Plan published')
      await qc.invalidateQueries({ queryKey: ['pricing'] })
    } catch (err) {
      handleServerError(err)
    }
  }

  const bgPreview = resolveAssetUrl(sectionForm.backgroundUrl)

  return (
    <TourismAdminShell
      title='Adventure pricing'
      description='Manage the “Prices For Rwanda Adventures” cards on the home page and /pricing.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className={`me-1 size-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant='outline' size='sm' asChild>
            <a href={`${publicBase}/pricing`} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-1 size-4' />
              Preview pricing
            </a>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/settings/navigation'>Navigation</Link>
          </Button>
          <Button size='sm' onClick={openCreate}>
            <Plus className='me-1 size-4' />
            Add plan
          </Button>
        </div>
      }
    >
      <Card className='max-w-4xl'>
        <CardHeader>
          <CardTitle>Section heading</CardTitle>
          <CardDescription>
            Eyebrow, title, background image, currency, and book button shown above the pricing
            cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={(e) => void saveSection(e)}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='pricing-eyebrow'>Eyebrow label</Label>
                <Input
                  id='pricing-eyebrow'
                  value={sectionForm.eyebrow}
                  onChange={(e) => setSectionForm((f) => ({ ...f, eyebrow: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pricing-title'>Section title</Label>
                <Input
                  id='pricing-title'
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
            </div>
            <ImageUploader
              label='Background image (optional)'
              value={sectionForm.backgroundUrl}
              onChange={(url) => setSectionForm((f) => ({ ...f, backgroundUrl: url }))}
            />
            {bgPreview ? (
              <div
                className='h-24 rounded-md border bg-cover bg-center'
                style={{ backgroundImage: `url(${bgPreview})` }}
              />
            ) : null}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='space-y-2'>
                <Label htmlFor='pricing-currency'>Currency symbol</Label>
                <Input
                  id='pricing-currency'
                  value={sectionForm.currency}
                  onChange={(e) => setSectionForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pricing-unit'>Price unit</Label>
                <Input
                  id='pricing-unit'
                  value={sectionForm.priceUnit}
                  onChange={(e) => setSectionForm((f) => ({ ...f, priceUnit: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pricing-cta-label'>Button label</Label>
                <Input
                  id='pricing-cta-label'
                  value={sectionForm.ctaLabel}
                  onChange={(e) => setSectionForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pricing-cta-link'>Button link</Label>
                <Input
                  id='pricing-cta-link'
                  value={sectionForm.ctaLink}
                  onChange={(e) => setSectionForm((f) => ({ ...f, ctaLink: e.target.value }))}
                  placeholder='/book'
                />
              </div>
            </div>
            <Button type='submit' disabled={sectionSaving}>
              {sectionSaving ? 'Saving…' : 'Save section'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className='mt-6 max-w-4xl'>
        <CardHeader>
          <CardTitle>Pricing plans</CardTitle>
          <CardDescription>
            Each card shows name, price, feature checklist, and a book button. Mark one plan as
            “Most Popular” for the highlighted yellow style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : plans.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No plans yet —{' '}
              <button
                type='button'
                className='text-primary underline underline-offset-4'
                onClick={openCreate}
              >
                add the first plan
              </button>
              .
            </p>
          ) : (
            <div className='divide-y rounded-md border'>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className='flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between'
                >
                  <div className='min-w-0 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-medium'>{plan.name}</p>
                      {plan.popular ? (
                        <Badge className='gap-1'>
                          <Star className='size-3' />
                          Most popular
                        </Badge>
                      ) : null}
                      <Badge variant={plan.active ? 'default' : 'secondary'}>
                        {plan.active ? 'Published' : 'Hidden'}
                      </Badge>
                      <Badge variant='outline'>Order {plan.sortOrder}</Badge>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      {section.currency}
                      {plan.priceUsd}
                      {section.priceUnit}
                    </p>
                    <ul className='text-muted-foreground list-inside list-disc text-sm'>
                      {(plan.features ?? []).slice(0, 4).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                      {(plan.features ?? []).length > 4 ? (
                        <li>+{(plan.features ?? []).length - 4} more</li>
                      ) : null}
                    </ul>
                    <div className='flex items-center gap-2 pt-1'>
                      <Switch
                        checked={plan.active}
                        onCheckedChange={() => void toggleActive(plan)}
                        aria-label={`Toggle ${plan.name}`}
                      />
                      <span className='text-muted-foreground text-xs'>
                        {plan.active ? 'Visible on site' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                  <ResourceRowActions
                    itemLabel={plan.name}
                    onEdit={() => openEdit(plan)}
                    onDelete={() => setDeletePlan(plan)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceEditDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditing(null)
            setPlanForm(emptyPlanForm())
          }
        }}
        title={editing ? 'Edit pricing plan' : 'Add pricing plan'}
        description='Name, price, and features appear on the home and pricing pages.'
        itemName={editing?.name}
        onSubmit={(e) => void savePlan(e)}
        saving={planSaving}
        saveLabel={editing ? 'Save changes' : 'Add plan'}
      >
        <div className='space-y-2'>
          <Label htmlFor='plan-name'>Plan name</Label>
          <Input
            id='plan-name'
            value={planForm.name}
            onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
            placeholder='Standard Travel'
            required
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='plan-price'>Price (USD)</Label>
            <Input
              id='plan-price'
              type='number'
              min={0}
              step='0.01'
              value={planForm.priceUsd}
              onChange={(e) => setPlanForm((f) => ({ ...f, priceUsd: e.target.value }))}
              placeholder='899'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='plan-order'>Sort order</Label>
            <Input
              id='plan-order'
              type='number'
              min={0}
              value={planForm.sortOrder}
              onChange={(e) => setPlanForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='plan-features'>Features (one per line)</Label>
          <Textarea
            id='plan-features'
            className='min-h-[140px] font-mono text-sm'
            value={planForm.featuresText}
            onChange={(e) => setPlanForm((f) => ({ ...f, featuresText: e.target.value }))}
            placeholder={'5 Days Tour\n7 Nights Stay\nAll Meals'}
            required
          />
        </div>
        <div className='flex flex-wrap items-center gap-6'>
          <div className='flex items-center gap-2'>
            <Switch
              id='plan-popular'
              checked={planForm.popular}
              onCheckedChange={(popular) => setPlanForm((f) => ({ ...f, popular }))}
            />
            <Label htmlFor='plan-popular'>Most popular (highlighted card)</Label>
          </div>
          <div className='flex items-center gap-2'>
            <Switch
              id='plan-active'
              checked={planForm.active}
              onCheckedChange={(active) => setPlanForm((f) => ({ ...f, active }))}
            />
            <Label htmlFor='plan-active'>Published on site</Label>
          </div>
        </div>
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deletePlan}
        onOpenChange={(open) => !open && setDeletePlan(null)}
        title='Delete pricing plan?'
        desc={
          deletePlan
            ? `Remove “${deletePlan.name}” from the site? This cannot be undone.`
            : ''
        }
        confirmText='Delete'
        destructive
        isLoading={deleting}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}
