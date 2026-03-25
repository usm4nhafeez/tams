'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  IndianRupee,
  FileText,
  MessageCircle,
  Settings,
  Building2,
  ChevronDown,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Campus',
    icon: Building2,
    items: [
      { title: 'Batches', href: '/campus/batches' },
      { title: 'Groups', href: '/campus/groups' },
    ],
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    title: 'Attendance',
    icon: CalendarCheck,
    items: [
      { title: 'Mark Attendance', href: '/attendance' },
      { title: 'Reports', href: '/attendance/reports' },
    ],
  },
  {
    title: 'Fees',
    icon: IndianRupee,
    items: [
      { title: 'Dashboard', href: '/fees' },
      { title: 'Collect', href: '/fees/collect' },
      { title: 'Generate', href: '/fees/generate' },
    ],
  },
  {
    title: 'Exams',
    icon: FileText,
    items: [
      { title: 'All Exams', href: '/exams' },
      { title: 'New Exam', href: '/exams/new' },
    ],
  },
  {
    title: 'WhatsApp',
    icon: MessageCircle,
    items: [
      { title: 'Status & Queue', href: '/whatsapp' },
      { title: 'Broadcast', href: '/whatsapp/broadcast' },
      { title: 'Message Logs', href: '/whatsapp/logs' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const isGroupActive = (items: { href: string }[]) => {
    return items.some((item) => isActive(item.href))
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TAMS</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Academy Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                if (item.href) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.items ? isGroupActive(item.items) : false}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={
                            item.items ? isGroupActive(item.items) : false
                          }
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.href)}
                              >
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Settings">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
