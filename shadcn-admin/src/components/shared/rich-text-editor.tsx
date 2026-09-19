import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  Pilcrow,
} from 'lucide-react'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { resolveAssetUrl } from '@/lib/asset-url'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cleanArticleHtml, plainTextToHtml } from '@/lib/clean-article-html'
import { cn } from '@/lib/utils'

const MAX_BYTES = 6 * 1024 * 1024

function neutralizeHtmlColors(html: string) {
  return String(html || '')
    .replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_match, quote: string, style: string) => {
      const next = String(style)
        .replace(/(?:^|;)\s*(?:color|background(?:-color)?|caret-color|background)\s*:[^;]*/gi, '')
        .replace(/^[;\s]+|[;\s]+$/g, '')
        .trim()
      return next ? ` style=${quote}${next}${quote}` : ''
    })
    .replace(/\s(?:color|bgcolor)=(["'])[\s\S]*?\1/gi, '')
    .replace(/<\/?font\b[^>]*>/gi, '')
}

async function uploadImageFile(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
  const res = await api.post('/api/uploads', { dataUrl, filename: file.name })
  return String(res.data?.url ?? '')
}

function toEditableHtml(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return '<p><br></p>'
  if (/<\/?[a-z][\s\S]*>/i.test(raw)) return neutralizeHtmlColors(raw)
  return plainTextToHtml(raw)
}

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  label?: string
  minHeight?: number
}

export function RichTextEditor({
  value,
  onChange,
  label = 'Article body',
  minHeight = 320,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const next = toEditableHtml(value)
    if (el.innerHTML !== next) el.innerHTML = next
  }, [value])

  const emit = () => {
    const html = editorRef.current?.innerHTML ?? ''
    onChange(html === '<p><br></p>' ? '' : html)
  }

  const run = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    emit()
  }

  const insertLink = () => {
    const href = window.prompt('Link URL', 'https://')
    if (!href?.trim()) return
    run('createLink', href.trim())
  }

  const insertImageAtCursor = (url: string, alt = '') => {
    const src = resolveAssetUrl(url)
    editorRef.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<p><img src="${src.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}"></p><p><br></p>`,
    )
    emit()
  }

  const onFiles = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : []
    const file = list.find((item) => item.type.startsWith('image/'))
    if (!file) return
    if (file.size > MAX_BYTES) return
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      insertImageAtCursor(url, file.name.replace(/\.[^.]+$/, ''))
    } catch (e) {
      handleServerError(e)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm'>
        <div className='bg-muted text-foreground flex flex-wrap items-center gap-1 border-b border-border p-1.5'>
          <ToolbarButton title='Paragraph' onClick={() => run('formatBlock', 'P')}>
            <Pilcrow />
          </ToolbarButton>
          <ToolbarButton title='Heading' onClick={() => run('formatBlock', 'H2')}>
            <Heading2 />
          </ToolbarButton>
          <ToolbarButton title='Subheading' onClick={() => run('formatBlock', 'H3')}>
            <Heading3 />
          </ToolbarButton>
          <ToolbarButton title='Bold' onClick={() => run('bold')}>
            <Bold />
          </ToolbarButton>
          <ToolbarButton title='Italic' onClick={() => run('italic')}>
            <Italic />
          </ToolbarButton>
          <ToolbarButton title='Bulleted list' onClick={() => run('insertUnorderedList')}>
            <List />
          </ToolbarButton>
          <ToolbarButton title='Insert link' onClick={insertLink}>
            <LinkIcon />
          </ToolbarButton>
          <ToolbarButton
            title='Insert image between text'
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus />
            <span className='hidden sm:inline'>{uploading ? 'Uploading…' : 'Insert image'}</span>
          </ToolbarButton>
          <input
            ref={fileRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
        <div
          ref={editorRef}
          className='admin-html rich-text-editor min-h-[12rem] px-4 py-3 text-[0.95rem] focus:outline-none'
          style={{ minHeight }}
          contentEditable
          role='textbox'
          aria-multiline='true'
          aria-label={label}
          data-placeholder='Write the article. Click Insert image to place a photo between paragraphs.'
          onPaste={(e) => {
            const dt = e.clipboardData
            if (!dt) return
            const imageFiles = Array.from(dt.files || []).filter((file) =>
              file.type.startsWith('image/'),
            )
            if (imageFiles.length) {
              e.preventDefault()
              void onFiles(imageFiles)
              return
            }
            const html = dt.getData('text/html')
            const text = dt.getData('text/plain')
            if (!html && !text) return
            e.preventDefault()
            const cleaned = html ? cleanArticleHtml(html) : plainTextToHtml(text)
            document.execCommand('insertHTML', false, cleaned || plainTextToHtml(text))
            emit()
          }}
          onInput={emit}
          onBlur={() => {
            const html = cleanArticleHtml(editorRef.current?.innerHTML ?? '')
            if (editorRef.current && html !== editorRef.current.innerHTML) {
              editorRef.current.innerHTML = html || '<p><br></p>'
            }
            onChange(!html || html === '<p><br></p>' ? '' : html)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.stopPropagation()
          }}
          suppressContentEditableWarning
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        Paste from Word or a website — headings, photos, and line breaks stay. Click Insert image
        to add a photo between paragraphs.
      </p>
      <style>{`
        .rich-text-editor:empty:before,
        .rich-text-editor p:only-child:has(br):before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
        }
      `}</style>
    </div>
  )
}

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className={cn('h-8 gap-1 px-2 text-foreground')}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
