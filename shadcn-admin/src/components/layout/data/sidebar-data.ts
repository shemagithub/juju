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

/** One-click nav — no nested menus. Sub-pages live as buttons on each screen. */
export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'superadmin@tourism.local',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'RwandaQuest',
      logo: Mountain,
      plan: 'Staff desk',
    },
  ],
  navGroups: [
    {
      title: 'Work',
      items: [
        { title: 'Home', url: '/', icon: LayoutDashboard },
        { title: 'Bookings', url: '/bookings', icon: CalendarDays },
        { title: 'Messages', url: '/messages/contact', icon: MessageSquare },
        { title: 'Car quotes', url: '/car-rental', icon: Car },
        { title: 'Reviews', url: '/reviews', icon: Star },
      ],
    },
    {
      title: 'Sell',
      items: [
        { title: 'Packages', url: '/tour-packages', icon: Package },
        { title: 'Destinations', url: '/destinations', icon: MapPinned },
        { title: 'Vehicles', url: '/car-rental/vehicles', icon: Car },
      ],
    },
    {
      title: 'Publish',
      items: [
        { title: 'Blog', url: '/blog', icon: Newspaper },
        { title: 'Photos', url: '/gallery', icon: Image },
        { title: 'Homepage', url: '/website/hero', icon: Sparkles },
        { title: 'Edit website', url: '/website', icon: Settings },
      ],
    },
  ],
}
