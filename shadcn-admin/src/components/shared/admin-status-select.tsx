import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type AdminStatusSelectProps = {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function AdminStatusSelect({
  value,
  options,
  onChange,
  disabled,
  className,
}: AdminStatusSelectProps) {
  const merged = options.includes(value) ? options : [...options, value]

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size='sm'
        className={cn('h-8 min-w-[8.5rem] text-xs capitalize', className)}
      >
        <SelectValue placeholder='Status' />
      </SelectTrigger>
      <SelectContent>
        {merged.map((opt) => (
          <SelectItem key={opt} value={opt} className='capitalize'>
            {opt.replace(/-/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
