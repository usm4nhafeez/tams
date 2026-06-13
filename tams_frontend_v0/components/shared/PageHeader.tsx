import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/72 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-start md:justify-between dark:border-white/8 dark:bg-slate-950/48', className)}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700/80 dark:text-sky-300/80">
          Control Center
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 self-start">{action}</div>}
    </div>
  )
}
