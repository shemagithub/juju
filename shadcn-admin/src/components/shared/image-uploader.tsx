import { useMemo, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { resolveAssetUrl } from '@/lib/asset-url'

const MAX_BYTES = 6 * 1024 * 1024

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

async function uploadImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  const res = await api.post('/api/uploads', { dataUrl, filename: file.name })
  return String(res.data?.url ?? '')
}

export function ImageUploader({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const preview = useMemo(() => {
    if (!value) return null
    return resolveAssetUrl(value)
  }, [value])

  const pickFile = () => inputRef.current?.click()

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_BYTES) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
      setUrlDraft('')
    } catch (e) {
      handleServerError(e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label>{label}</Label>
        {required ? <Badge variant='secondary'>Required</Badge> : null}
      </div>

      <div
        className={cn(
          'bg-muted/30 rounded-md border p-3',
          dragOver && 'border-primary ring-primary/20 ring-[3px]',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void onFiles(e.dataTransfer.files)
        }}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button type='button' variant='outline' size='sm' onClick={pickFile} disabled={uploading}>
            <Upload className='me-1 size-4' />
            {uploading ? 'Uploading…' : 'Upload / Drop image'}
          </Button>
          <input
            ref={inputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => void onFiles(e.target.files)}
          />

          <div className='min-w-[220px] flex-1'>
            <Input
              placeholder='Or paste image URL (https://...)'
              type='url'
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={() => {
                if (!urlDraft.trim()) return
                onChange(urlDraft.trim())
              }}
            />
          </div>

          {value ? (
            <Button type='button' variant='ghost' size='sm' onClick={() => onChange('')}>
              <X className='me-1 size-4' />
              Remove
            </Button>
          ) : null}
        </div>

        {preview ? (
          <div className='mt-3 overflow-hidden rounded-md border'>
            <img src={preview} alt='Preview' className='h-48 w-full object-cover' />
          </div>
        ) : (
          <p className='text-muted-foreground mt-2 text-xs'>
            Tip: drag and drop an image file, or paste a URL. Uploaded files are served from your API
            under <code>/uploads/</code>.
          </p>
        )}
        <p className='text-muted-foreground mt-2 text-xs'>Max file size: 6MB.</p>
      </div>
    </div>
  )
}

export function ImagesUploader({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const pickFiles = () => inputRef.current?.click()

  const onFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    if (list.some((f) => f.size > MAX_BYTES)) return
    setUploading(true)
    try {
      const uploaded = []
      for (const f of list) uploaded.push(await uploadImage(f))
      onChange([...(value ?? []), ...uploaded].filter(Boolean))
      setUrlDraft('')
    } catch (e) {
      handleServerError(e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label>{label}</Label>
        {required ? <Badge variant='secondary'>Required</Badge> : null}
      </div>

      <div
        className={cn(
          'bg-muted/30 rounded-md border p-3',
          dragOver && 'border-primary ring-primary/20 ring-[3px]',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void onFiles(e.dataTransfer.files)
        }}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button type='button' variant='outline' size='sm' onClick={pickFiles} disabled={uploading}>
            <Upload className='me-1 size-4' />
            {uploading ? 'Uploading…' : 'Upload / Drop images'}
          </Button>
          <input
            ref={inputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={(e) => void onFiles(e.target.files)}
          />

          <div className='min-w-[220px] flex-1'>
            <Input
              placeholder='Add image URL then tab/click away'
              type='url'
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={() => {
                const u = urlDraft.trim()
                if (!u) return
                onChange([...(value ?? []), u])
                setUrlDraft('')
              }}
            />
          </div>

          {value?.length ? (
            <Button type='button' variant='ghost' size='sm' onClick={() => onChange([])}>
              <X className='me-1 size-4' />
              Clear
            </Button>
          ) : null}
        </div>

        {value?.length ? (
          <div className='mt-3 grid gap-3 sm:grid-cols-2'>
            {value.map((u, idx) => (
              <div key={`${u}-${idx}`} className='overflow-hidden rounded-md border'>
                <div className='bg-muted flex items-center justify-between gap-2 border-b px-2 py-1 text-xs'>
                  <span className='truncate'>{u}</span>
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground'
                    onClick={() => onChange(value.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
                <img
                  src={resolveAssetUrl(u)}
                  alt={`Image ${idx + 1}`}
                  className='h-32 w-full object-cover'
                />
              </div>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground mt-2 text-xs'>
            Drop multiple images, or paste URLs one-by-one.
          </p>
        )}
        <p className='text-muted-foreground mt-2 text-xs'>Max file size: 6MB.</p>
      </div>
    </div>
  )
}

