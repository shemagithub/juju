import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Plus, RefreshCw, UserCircle } from 'lucide-react'
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
import { useSiteSettingsQuery, useTeamMembersQuery } from '../hooks/use-tourism-queries'

type TeamMember = {
  id: string
  name: string
  title: string
  bio: string
  photoUrl: string
  active: boolean
  sortOrder: number
}

type MemberForm = {
  name: string
  title: string
  bio: string
  photoUrl: string
  active: boolean
  sortOrder: string
}

const emptyForm = (): MemberForm => ({
  name: '',
  title: '',
  bio: '',
  photoUrl: '',
  active: true,
  sortOrder: '0',
})

function readForm(member?: TeamMember | null): MemberForm {
  if (!member) return emptyForm()
  return {
    name: member.name,
    title: member.title,
    bio: member.bio,
    photoUrl: member.photoUrl,
    active: member.active,
    sortOrder: String(member.sortOrder ?? 0),
  }
}

export function TourismTeamSettingsPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch, isFetching } = useTeamMembersQuery()
  const { data: settings = {} } = useSiteSettingsQuery()
  const publicBase = String(
    (settings as Record<string, string>).publicSiteUrl ?? 'http://localhost:3000',
  ).replace(/\/$/, '')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm())
  const [pending, setPending] = useState(false)
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  const rows = [...(data as TeamMember[])].sort((a, b) => a.sortOrder - b.sortOrder)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (member: TeamMember) => {
    setEditing(member)
    setForm(readForm(member))
    setDialogOpen(true)
  }

  const saveMember = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const name = form.name.trim()
    const title = form.title.trim()
    const bio = form.bio.trim()
    if (!name || !title || !bio) {
      toast.error('Name, title, and bio are required')
      return
    }

    setPending(true)
    try {
      const payload = {
        name,
        title,
        bio,
        photoUrl: form.photoUrl.trim(),
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (editing) {
        await api.patch(`/api/team-members/${editing.id}`, payload)
        toast.success('Team member updated')
      } else {
        await api.post('/api/team-members', payload)
        toast.success('Team member added')
      }
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm())
      await qc.invalidateQueries({ queryKey: ['team-members'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setPending(false)
    }
  }

  const doDelete = async () => {
    if (!deleteMember) return
    setDeleting(true)
    try {
      await api.delete(`/api/team-members/${deleteMember.id}`)
      toast.success('Team member removed')
      setDeleteMember(null)
      await qc.invalidateQueries({ queryKey: ['team-members'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (member: TeamMember) => {
    try {
      await api.patch(`/api/team-members/${member.id}`, { active: !member.active })
      toast.success(member.active ? 'Member hidden from site' : 'Member published')
      await qc.invalidateQueries({ queryKey: ['team-members'] })
    } catch (e) {
      handleServerError(e)
    }
  }

  return (
    <TourismAdminShell
      title='Team members'
      description='People shown on the About page. Add a name, job title, and photo.'
      actions={
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className={`me-1 size-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant='outline' size='sm' asChild>
            <a href={`${publicBase}/about`} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='me-1 size-4' />
              Preview About
            </a>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/settings/about'>About Us Page</Link>
          </Button>
          <Button size='sm' onClick={openCreate}>
            <Plus className='me-1 size-4' />
            Add member
          </Button>
        </div>
      }
    >
      <Card className='max-w-4xl'>
        <CardHeader>
          <CardTitle>Team roster</CardTitle>
          <CardDescription>
            Active members appear on <code className='text-xs'>/about</code> in sort order. Hidden
            members stay in admin but are not shown publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : rows.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No team members yet —{' '}
              <button type='button' className='text-primary underline underline-offset-4' onClick={openCreate}>
                add the first member
              </button>
              .
            </p>
          ) : (
            <div className='divide-y rounded-md border'>
              {rows.map((member) => {
                const photo = resolveAssetUrl(member.photoUrl)
                return (
                  <div
                    key={member.id}
                    className='flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between'
                  >
                    <div className='flex min-w-0 gap-3'>
                      <div className='bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full'>
                        {photo ? (
                          <img src={photo} alt='' className='size-full object-cover' />
                        ) : (
                          <UserCircle className='text-muted-foreground size-8' />
                        )}
                      </div>
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-medium'>{member.name}</p>
                          <Badge variant={member.active ? 'default' : 'secondary'}>
                            {member.active ? 'Published' : 'Hidden'}
                          </Badge>
                          <Badge variant='outline'>Order {member.sortOrder}</Badge>
                        </div>
                        <p className='text-muted-foreground text-sm'>{member.title}</p>
                        <p className='text-muted-foreground line-clamp-2 text-sm'>{member.bio}</p>
                        <div className='flex items-center gap-2 pt-1'>
                          <Switch
                            checked={member.active}
                            onCheckedChange={() => void toggleActive(member)}
                            aria-label={`Toggle ${member.name}`}
                          />
                          <span className='text-muted-foreground text-xs'>
                            {member.active ? 'Visible on site' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ResourceRowActions
                      itemLabel={member.name}
                      onEdit={() => openEdit(member)}
                      onDelete={() => setDeleteMember(member)}
                    />
                  </div>
                )
              })}
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
            setForm(emptyForm())
          }
        }}
        title={editing ? 'Edit team member' : 'Add team member'}
        description='Name, job title, and photo on the About page.'
        itemName={editing?.name}
        onSubmit={(e) => void saveMember(e)}
        saving={pending}
        saveLabel={editing ? 'Save changes' : 'Add member'}
      >
        <div className='space-y-2'>
          <Label htmlFor='team-name'>Name</Label>
          <Input
            id='team-name'
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder='Jean Baptiste'
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='team-title'>Title / role</Label>
          <Input
            id='team-title'
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder='Senior Tour Guide'
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='team-bio'>Bio</Label>
          <Textarea
            id='team-bio'
            className='min-h-[120px]'
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder='Short biography shown on the About page…'
            required
          />
        </div>
        <ImageUploader
          label='Photo (optional)'
          value={form.photoUrl}
          onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='team-order'>Sort order</Label>
            <Input
              id='team-order'
              type='number'
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div className='flex items-end gap-2 pb-2'>
            <Switch
              id='team-active'
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
            <Label htmlFor='team-active'>Published on About page</Label>
          </div>
        </div>
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteMember}
        onOpenChange={(open) => !open && setDeleteMember(null)}
        title='Remove team member?'
        desc={
          deleteMember
            ? `Delete ${deleteMember.name} from the team roster. This cannot be undone.`
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
