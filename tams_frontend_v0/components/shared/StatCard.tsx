import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: 'blue' | 'green' | 'red' | 'navy' | 'yellow'
  subText?: string
  className?: string
}

const variantStyles = {
  blue: {
    card: 'border-sky-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(224,242,254,0.88))] dark:border-sky-900/40 dark:bg-[linear-gradient(135deg,rgba(12,74,110,0.28),rgba(3,37,65,0.24))]',
    icon: 'bg-white/80 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200',
    title: 'text-sky-800/80 dark:text-sky-100/80',
    value: 'text-sky-950 dark:text-sky-50',
  },
  green: {
    card: 'border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(209,250,229,0.9))] dark:border-emerald-900/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.3),rgba(2,44,34,0.26))]',
    icon: 'bg-white/80 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
    title: 'text-emerald-800/80 dark:text-emerald-100/80',
    value: 'text-emerald-950 dark:text-emerald-50',
  },
  red: {
    card: 'border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,228,230,0.88))] dark:border-rose-900/40 dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.3),rgba(76,5,25,0.24))]',
    icon: 'bg-white/80 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
    title: 'text-rose-800/80 dark:text-rose-100/80',
    value: 'text-rose-950 dark:text-rose-50',
  },
  navy: {
    card: 'border-slate-200/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.94))] dark:border-slate-800/60 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.68),rgba(30,41,59,0.55))]',
    icon: 'bg-slate-900 text-white dark:bg-white/10 dark:text-white',
    title: 'text-slate-700 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white',
  },
  yellow: {
    card: 'border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(254,243,199,0.9))] dark:border-amber-900/40 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.26),rgba(69,26,3,0.22))]',
    icon: 'bg-white/80 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
    title: 'text-amber-800/80 dark:text-amber-100/80',
    value: 'text-amber-950 dark:text-amber-50',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'navy',
  subText,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  return (
    <div
      className={cn(
        'rounded-[24px] border p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5',
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', styles.title)}>{title}</p>
          <p className={cn('mt-1 text-2xl font-bold', styles.value)}>{value}</p>
          {subText && <p className="mt-1 text-xs text-muted-foreground">{subText}</p>}
        </div>
        <div className={cn('ml-3 rounded-2xl p-2.5 shrink-0 shadow-sm', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
