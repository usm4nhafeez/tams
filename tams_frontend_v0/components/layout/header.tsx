'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  campus: 'Campus',
  batches: 'Batches',
  groups: 'Groups',
  students: 'Students',
  new: 'New',
  edit: 'Edit',
  attendance: 'Attendance',
  reports: 'Reports',
  fees: 'Fees',
  collect: 'Collect',
  generate: 'Generate',
  exams: 'Exams',
  marks: 'Marks',
  whatsapp: 'WhatsApp',
  broadcast: 'Broadcast',
  logs: 'Logs',
  settings: 'Settings',
}

export function Header() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1
    
    // Check if segment is a dynamic ID (UUID or numeric)
    const isDynamicId = /^[0-9a-f-]{36}$|^\d+$/.test(segment)
    const label = isDynamicId ? 'Details' : (routeLabels[segment] || segment)

    return {
      label,
      href,
      isLast,
    }
  })

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.length > 0 && segments[0] !== '' && (
            <>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
