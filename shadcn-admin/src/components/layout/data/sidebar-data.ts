import {
  CalendarDays,
  Car,
  Image,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Mountain,
  Newspaper,
  Package,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import { type SidebarData } from '../types'

/** MVP sidebar — focused on day-to-day tourism operations and website control. */
export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'superadmin@tourism.local',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Tourism Admin',
      logo: Mountain,
      plan: 'Operations',
    },
  ],
  navGroups: [
    {
      title: 'Home',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Inbox',
      items: [
        {
          title: 'Bookings',
          url: '/bookings',
          icon: CalendarDays,
        },
        {
          title: 'Messages',
          url: '/messages/contact',
          icon: MessageSquare,
        },
        {
          title: 'Car rental quotes',
          url: '/car-rental',
          icon: Car,
        },
        {
          title: 'Reviews',
          url: '/reviews',
          icon: Star,
        },
      ],
    },
    {
      title: 'Website',
      items: [
        {
          title: 'Home hero',
          icon: Sparkles,
          items: [
            { title: 'All slides', url: '/website/hero' },
            { title: 'Add slide', url: '/website/hero/new' },
          ],
        },
        {
          title: 'Site settings',
          icon: Settings,
          items: [
            { title: 'Contact & Brand', url: '/settings/contact' },
            { title: 'Website content', url: '/settings/content' },
            { title: 'About page', url: '/settings/about' },
            { title: 'Team members', url: '/settings/team' },
            { title: 'Navigation', url: '/settings/navigation' },
            { title: 'SEO', url: '/settings/seo' },
            { title: 'Legal pages', url: '/settings/legal' },
            { title: 'Social links', url: '/settings/social' },
          ],
        },
      ],
    },
    {
      title: 'Catalog',
      items: [
        {
          title: 'Tour packages',
          icon: Package,
          items: [
            { title: 'All packages', url: '/tour-packages' },
            { title: 'Categories', url: '/tour-packages/categories' },
            { title: 'Add package', url: '/tour-packages/new' },
          ],
        },
        {
          title: 'Destinations',
          url: '/destinations',
          icon: MapPinned,
        },
        {
          title: 'Car fleet',
          icon: Car,
          items: [
            { title: 'All vehicles', url: '/car-rental/vehicles' },
            { title: 'Categories', url: '/car-rental/vehicles/categories' },
            { title: 'Add vehicle', url: '/car-rental/vehicles/new' },
          ],
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          title: 'Blog',
          url: '/blog',
          icon: Newspaper,
        },
        {
          title: 'Gallery',
          url: '/gallery',
          icon: Image,
        },
      ],
    },
  ],
}
