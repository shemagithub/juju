import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ImageUploader } from '@/components/shared/image-uploader'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { ResourceEditDialog } from '@/components/shared/resource-edit-dialog'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { ResourceViewDialog } from '@/components/shared/resource-view-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { resolveAssetUrl } from '@/lib/asset-url'
import { TourismAdminShell } from '../components/tourism-admin-shell'
import { useBlogCategoriesQuery, useBlogPostsQuery } from '../hooks/use-tourism-queries'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  categoryId: string | null
  coverImageUrl: string
  published: boolean
  updatedAt: string
}

type BlogCat = { id: string; name: string; slug: string }

export function TourismBlogPage({ variant }: { variant: 'list' | 'new' | 'categories' }) {
  if (variant === 'new') return <BlogNewPage />
  if (variant === 'categories') return <BlogCategoriesPage />
  return <BlogListPage />
}

function BlogListPage() {
  const qc = useQueryClient()
  const { data = [], isPending, refetch } = useBlogPostsQuery()
  const { data: cats = [] } = useBlogCategoriesQuery()
  const [viewPost, setViewPost] = useState<Post | null>(null)
  const [editDraft, setEditDraft] = useState<Post | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categoryName = (id: string | null) => {
    if (!id) return '—'
    const hit = (cats as BlogCat[]).find((c) => c.id === id)
    return hit?.name ?? id
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDraft) return
    if (!editDraft.coverImageUrl?.trim()) return toast.error('Cover image is required')
    setEditSaving(true)
    try {
      await api.patch(`/api/blog/posts/${editDraft.id}`, {
        title: editDraft.title,
        excerpt: editDraft.excerpt,
        body: editDraft.body,
        categoryId: editDraft.categoryId || undefined,
        coverImageUrl: editDraft.coverImageUrl.trim(),
        published: editDraft.published,
      })
      toast.success('Post updated')
      setEditDraft(null)
      await qc.invalidateQueries({ queryKey: ['blog-posts'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deletePost) return
    setDeleting(true)
    try {
      await api.delete(`/api/blog/posts/${deletePost.id}`)
      toast.success('Post deleted')
      setDeletePost(null)
      await qc.invalidateQueries({ queryKey: ['blog-posts'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (e) {
      handleServerError(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TourismAdminShell
      title='Blog'
      description='Write a story. Put photos between the paragraphs.'
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()}>
            <RefreshCw className='me-1 size-4' />
            Refresh
          </Button>
          <Button size='sm' asChild>
            <Link to='/blog/new'>
              <Plus className='me-1 size-4' />
              Add post
            </Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardContent className='pt-6'>
          {isPending ? (
            <p className='text-muted-foreground text-sm'>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as Post[]).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='font-medium'>{p.title}</TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {categoryName(p.categoryId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.published ? 'default' : 'secondary'}>
                        {p.published ? 'Live' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <ResourceRowActions
                        itemLabel={p.title}
                        onView={() => setViewPost(p)}
                        onEdit={() => setEditDraft({ ...p })}
                        onDelete={() => setDeletePost(p)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewPost}
        onOpenChange={(o) => !o && setViewPost(null)}
        title={viewPost?.title ?? 'Post'}
        description={
          viewPost
            ? `${viewPost.published ? 'Published' : 'Draft'} · ${categoryName(viewPost.categoryId)}`
            : undefined
        }
        size='3xl'
        onEdit={viewPost ? () => setEditDraft({ ...viewPost }) : undefined}
      >
        {viewPost ? (
          <div className='space-y-4'>
            {viewPost.coverImageUrl ? (
              <div className='overflow-hidden rounded-md border'>
                <img
                  src={resolveAssetUrl(viewPost.coverImageUrl)}
                  alt={viewPost.title}
                  className='h-56 w-full object-cover'
                />
              </div>
            ) : null}
            {viewPost.excerpt ? (
              <div className='rounded-md border p-3'>
                <p className='text-muted-foreground text-xs'>Excerpt</p>
                <p className='mt-1 text-sm'>{viewPost.excerpt}</p>
              </div>
            ) : null}
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>Body</p>
              {viewPost.body ? (
                <div
                  className='admin-html mt-2 max-h-[45vh] overflow-auto rounded-md border p-3 text-sm'
                  dangerouslySetInnerHTML={{ __html: viewPost.body }}
                />
              ) : (
                <p className='mt-2 text-sm'>—</p>
              )}
            </div>
            <div className='text-muted-foreground text-xs'>
              <p>
                <span className='font-medium'>Slug:</span> {viewPost.slug}
              </p>
              <p>
                <span className='font-medium'>Updated:</span>{' '}
                {new Date(viewPost.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editDraft}
        onOpenChange={(o) => !o && setEditDraft(null)}
        title='Edit post'
        description='Change the story, then Save. Put photos between paragraphs.'
        itemName={editDraft?.title}
        onSubmit={saveEdit}
        saving={editSaving}
        size='4xl'
      >
        {editDraft ? (
          <>
              <div className='space-y-2'>
                <Label htmlFor='et'>Title</Label>
                <Input
                  id='et'
                  value={editDraft.title}
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ee'>Excerpt</Label>
                <Input
                  id='ee'
                  value={editDraft.excerpt}
                  onChange={(e) => setEditDraft({ ...editDraft, excerpt: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ecat'>Category</Label>
                <select
                  id='ecat'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editDraft.categoryId ?? ''}
                  onChange={(e) =>
                    setEditDraft({
                      ...editDraft,
                      categoryId: e.target.value || null,
                    })
                  }
                >
                  <option value=''>— None —</option>
                  {(cats as BlogCat[]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <RichTextEditor
                value={editDraft.body}
                onChange={(html) => setEditDraft({ ...editDraft, body: html })}
              />
              <ImageUploader
                label='Cover image'
                value={editDraft.coverImageUrl}
                onChange={(url) => setEditDraft({ ...editDraft, coverImageUrl: url })}
                required
              />
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={editDraft.published}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, published: e.target.checked })
                  }
                />
                Published
              </label>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deletePost}
        onOpenChange={(o) => !o && setDeletePost(null)}
        title='Delete blog post?'
        desc={
          <div className='space-y-2'>
            <p>This will permanently delete the post.</p>
            <p className='font-medium'>{deletePost?.title}</p>
          </div>
        }
        destructive
        isLoading={deleting}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDelete()}
      />
    </TourismAdminShell>
  )
}

function BlogNewPage() {
  const qc = useQueryClient()
  const { data: cats = [] } = useBlogCategoriesQuery()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coverImageUrl.trim()) return toast.error('Cover image is required')
    setPending(true)
    try {
      await api.post('/api/blog/posts', {
        title,
        excerpt,
        body,
        categoryId: categoryId || undefined,
        coverImageUrl: coverImageUrl.trim(),
        published,
      })
      toast.success('Post created')
      await qc.invalidateQueries({ queryKey: ['blog-posts'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <TourismAdminShell
      title='Add blog post'
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link to='/blog'>Back</Link>
        </Button>
      }
    >
      <Card className='max-w-4xl'>
        <CardHeader>
          <CardTitle>New post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='t'>Title</Label>
              <Input
                id='t'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ex'>Excerpt</Label>
              <Input
                id='ex'
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cat'>Category</Label>
              <select
                id='cat'
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value=''>— None —</option>
                {(cats as BlogCat[]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <RichTextEditor value={body} onChange={setBody} />
            <ImageUploader
              label='Cover image'
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              required
            />
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published
            </label>
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : 'Publish'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TourismAdminShell>
  )
}

function BlogCategoriesPage() {
  const qc = useQueryClient()
  const { data = [], refetch } = useBlogCategoriesQuery()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [viewCat, setViewCat] = useState<BlogCat | null>(null)
  const [editCat, setEditCat] = useState<BlogCat | null>(null)
  const [editCatSaving, setEditCatSaving] = useState(false)
  const [deleteCat, setDeleteCat] = useState<BlogCat | null>(null)
  const [deletingCat, setDeletingCat] = useState(false)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setPending(true)
    try {
      await api.post('/api/blog/categories', { name: name.trim() })
      toast.success('Category created')
      setName('')
      await qc.invalidateQueries({ queryKey: ['blog-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setPending(false)
    }
  }

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCat?.name.trim()) return
    setEditCatSaving(true)
    try {
      await api.patch(`/api/blog/categories/${editCat.id}`, { name: editCat.name.trim() })
      toast.success('Category updated')
      setEditCat(null)
      await qc.invalidateQueries({ queryKey: ['blog-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setEditCatSaving(false)
    }
  }

  const doDeleteCategory = async () => {
    if (!deleteCat) return
    setDeletingCat(true)
    try {
      await api.delete(`/api/blog/categories/${deleteCat.id}`)
      toast.success('Category deleted')
      setDeleteCat(null)
      await qc.invalidateQueries({ queryKey: ['blog-categories'] })
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    } catch (err) {
      handleServerError(err)
    } finally {
      setDeletingCat(false)
    }
  }

  return (
    <TourismAdminShell
      title='Blog categories'
      actions={
        <Button variant='outline' size='sm' onClick={() => void refetch()}>
          <RefreshCw className='me-1 size-4' />
          Refresh
        </Button>
      }
    >
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className='flex flex-wrap gap-2'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Travel, Safari…'
              className='max-w-xs'
            />
            <Button type='submit' disabled={pending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='pt-6'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as BlogCat[]).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className='text-muted-foreground'>{c.slug}</TableCell>
                  <TableCell className='text-right'>
                    <ResourceRowActions
                      itemLabel={c.name}
                      onView={() => setViewCat(c)}
                      onEdit={() => setEditCat({ ...c })}
                      onDelete={() => setDeleteCat(c)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ResourceViewDialog
        open={!!viewCat}
        onOpenChange={(o) => !o && setViewCat(null)}
        title={viewCat?.name ?? 'Category'}
        description='Category details'
        onEdit={viewCat ? () => setEditCat({ ...viewCat }) : undefined}
      >
        {viewCat ? (
          <div className='space-y-2 text-sm'>
            <p>
              <span className='text-muted-foreground'>Slug:</span> {viewCat.slug}
            </p>
            <p className='font-mono text-xs'>{viewCat.id}</p>
          </div>
        ) : null}
      </ResourceViewDialog>

      <ResourceEditDialog
        open={!!editCat}
        onOpenChange={(o) => !o && setEditCat(null)}
        title='Edit category'
        itemName={editCat?.name}
        onSubmit={saveCategory}
        saving={editCatSaving}
      >
        {editCat ? (
          <>
            <div className='space-y-2'>
              <Label htmlFor='cn'>Name</Label>
              <Input
                id='cn'
                value={editCat.name}
                onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                required
              />
            </div>
            <p className='text-muted-foreground text-xs'>The website link updates when you change the name.</p>
          </>
        ) : null}
      </ResourceEditDialog>

      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => (o ? null : setDeleteCat(null))}
        title='Delete category?'
        desc={
          <span>
            Remove <strong>{deleteCat?.name}</strong>? Posts referencing it may need a new category.
          </span>
        }
        destructive
        isLoading={deletingCat}
        confirmText={deletingCat ? 'Deleting…' : 'Delete'}
        handleConfirm={() => void doDeleteCategory()}
      />
    </TourismAdminShell>
  )
}
