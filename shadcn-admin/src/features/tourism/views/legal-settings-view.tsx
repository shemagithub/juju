import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, RefreshCw } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useSiteSettingsQuery } from '../hooks/use-tourism-queries'

type LegalFormState = {
  title: string
  subtitle: string
  updated: string
  content: string
}

type LegalKeys = {
  title: string
  subtitle: string
  updated: string
  content: string
}

const PRIVACY_KEYS: LegalKeys = {
  title: 'privacyPolicyTitle',
  subtitle: 'privacyPolicySubtitle',
  updated: 'privacyPolicyUpdated',
  content: 'privacyPolicyContent',
}

const TERMS_KEYS: LegalKeys = {
  title: 'termsConditionsTitle',
  subtitle: 'termsConditionsSubtitle',
  updated: 'termsConditionsUpdated',
  content: 'termsConditionsContent',
}

function readLegal(settings: Record<string, unknown>, keys: LegalKeys): LegalFormState {
  return {
    title: String(settings[keys.title] ?? ''),
    subtitle: String(settings[keys.subtitle] ?? ''),
    updated: String(settings[keys.updated] ?? ''),
    content: String(settings[keys.content] ?? ''),
  }
}

function LegalEditor({
  label,
  previewPath,
  form,
  onChange,
  onSave,
  pending,
  publicBase,
}: {
  label: string
  previewPath: string
  form: LegalFormState
  onChange: (next: LegalFormState) => void
  onSave: () => void
  pending: boolean
  publicBase: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          Shown on the website. Use ## for a heading. Put a blank line between paragraphs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Page title</Label>
              <Input
                value={form.title}
                onChange={(e) => onChange({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label>Last updated (display)</Label>
              <Input
                value={form.updated}
                onChange={(e) => onChange({ ...form, updated: e.target.value })}
                placeholder='June 2025'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Subtitle</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => onChange({ ...form, subtitle: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label>Content</Label>
            <Textarea
              className='min-h-[360px] text-sm leading-relaxed'
              value={form.content}
              onChange={(e) => onChange({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : `Save ${label.toLowerCase()}`}
            </Button>
            <Button type='button' variant='outline' asChild>
              <a href={`${publicBase}${previewPath}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='me-1 size-4' />
                Preview on site
              </a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function TourismLegalSettingsPage() {
  const qc = useQueryClient()
  const { data = {}, isPending, refetch } = useSiteSettingsQuery()
  const settings = data as Record<string, unknown>
  const [pending, setPending] = useState(false)
  const [privacy, setPrivacy] = useState<LegalFormState | null>(null)
  const [terms, setTerms] = useState<LegalFormState | null>(null)

  const privacyForm = privacy ?? readLegal(settings, PRIVACY_KEYS)
  const termsForm = terms ?? readLegal(settings, TERMS_KEYS)
  const publicBase = String(settings.publicSiteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  const save = async (keys: LegalKeys, form: LegalFormState, success: string) => {
    setPending(true)
    try {
      await api.patch('/api/site-settings', {
        [keys.title]: form.title.trim(),
        [keys.subtitle]: form.subtitle.trim(),
        [keys.updated]: form.updated.trim(),
        [keys.content]: form.content.trim(),
      })
      toast.success(success)
      await qc.invalidateQueries({ queryKey: ['site-settings'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='Legal pages'
      description='Privacy and terms pages in the website footer.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Reload
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/website'>Website pages</Link>
          </Button>
        </div>
      }
    >
      {isPending ? (
        <p className='text-muted-foreground text-sm'>Loading…</p>
      ) : (
        <Tabs defaultValue='privacy' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='privacy'>Privacy Policy</TabsTrigger>
            <TabsTrigger value='terms'>Terms & Conditions</TabsTrigger>
          </TabsList>
          <TabsContent value='privacy'>
            <LegalEditor
              label='Privacy Policy'
              previewPath='/privacy'
              form={privacyForm}
              onChange={setPrivacy}
              onSave={() => void save(PRIVACY_KEYS, privacyForm, 'Privacy policy saved')}
              pending={pending}
              publicBase={publicBase}
            />
          </TabsContent>
          <TabsContent value='terms'>
            <LegalEditor
              label='Terms & Conditions'
              previewPath='/terms'
              form={termsForm}
              onChange={setTerms}
              onSave={() => void save(TERMS_KEYS, termsForm, 'Terms & conditions saved')}
              pending={pending}
              publicBase={publicBase}
            />
          </TabsContent>
        </Tabs>
      )}
    </TourismAdminShell>
  )
}
