/** Shared responsive class strings for admin UI primitives. */
export const DIALOG_SCROLL_CLASS =
  'max-h-[min(92dvh,100%)] overflow-y-auto overscroll-y-contain p-4 sm:p-6'

export const DIALOG_SIZE_CLASS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
} as const

export type AdminDialogSize = keyof typeof DIALOG_SIZE_CLASS

export const FORM_GRID_CLASS =
  'grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'

export const FILTER_TOOLBAR_CLASS =
  'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export const PAGE_ACTIONS_CLASS =
  'flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end'

export const SETTINGS_CARD_WIDTH = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  full: 'max-w-none w-full',
} as const
