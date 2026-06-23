import { type Row } from '@tanstack/react-table'
import { ResourceRowActions } from '@/components/shared/resource-row-actions'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  return (
    <ResourceRowActions
      onView={() => {
        setCurrentRow(row.original)
        setOpen('view')
      }}
      onEdit={() => {
        setCurrentRow(row.original)
        setOpen('edit')
      }}
      onDelete={() => {
        setCurrentRow(row.original)
        setOpen('delete')
      }}
    />
  )
}
