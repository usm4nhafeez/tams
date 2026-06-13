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
        'flex items-center rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.18)]'
          : 'text-slate-200/92 hover:bg-white/10 hover:text-white'
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
          'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.18)]'
            : 'text-slate-200/92 hover:bg-white/10 hover:text-white'
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
          'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isChildActive
            ? 'bg-white/12 text-white'
            : 'text-slate-200/92 hover:bg-white/10 hover:text-white'
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
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0f2744_0%,#16385d_45%,#10253f_100%)]">
      <div className="border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/12 p-2.5 shadow-inner shadow-white/10">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">
              Academy OS
            </p>
            <span className="text-base font-bold text-white">TAMS</span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-sm text-slate-100/90">
          <p className="font-semibold">Tips Academy</p>
          <p className="mt-1 text-xs leading-5 text-slate-300/85">
            Daily operations, parent communication, and academic records in one dashboard.
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navItems.map((item) => (
          <NavGroup key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-200/65">
          Built for clarity
        </p>
        <p className="mt-1 text-xs text-slate-300/80">Students, fees, exams, attendance, and WhatsApp updates.</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-3 top-3 z-50 h-9 w-9 rounded-full border border-slate-200/70 bg-white/80 shadow-lg backdrop-blur lg:hidden dark:border-white/10 dark:bg-slate-950/70"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>
    </>
  )
}
