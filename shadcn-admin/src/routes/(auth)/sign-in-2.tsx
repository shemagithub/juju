import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy URL — redirect to the main sign-in page. */
export const Route = createFileRoute('/(auth)/sign-in-2')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/sign-in',
      search,
    })
  },
})
