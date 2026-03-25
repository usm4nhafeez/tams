'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  DollarSign,
  ClipboardList,
  MessageCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  School,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Campus',
    icon: School,
    children: [
      { label: 'Batches', href: '/campus/batches' },
      { label: 'Groups', href: '/campus/groups' },
    ],
  },
  { label: 'Students', href: '/students', icon: Users },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { label: 'Fees', href: '/fees', icon: DollarSign },
  { label: 'Exams', href: '/exams', icon: ClipboardList },
  { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white/15 text-white'
          : 'text-blue-200 hover:bg-white/10 hover:text-white'
      )}
    >
      {label}
    </Link>
  )
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const isChildActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  const [open, setOpen] = useState(isChildActive)
  const Icon = item.icon

  if (!item.children) {
    const isActive = item.href
      ? pathname === item.href || pathname.startsWith(item.href + '/')
      : false
    return (
      <Link
        href={item.href!}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-blue-200 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isChildActive
            ? 'bg-white/15 text-white'
            : 'text-blue-200 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {open && (
        <div className="ml-7 mt-1 space-y-1">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              href={child.href}
              label={child.label}
              isActive={pathname.startsWith(child.href)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col bg-[#1E3A5F]">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <GraduationCap className="h-6 w-6 text-white" />
        <span className="text-base font-bold text-white">TAMS</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => (
          <NavGroup key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-xs text-blue-300">Tips Academy Management</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 border-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>
    </>
  )
}
