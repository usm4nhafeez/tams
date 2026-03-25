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
    card: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    title: 'text-blue-700 dark:text-blue-300',
    value: 'text-blue-900 dark:text-blue-100',
  },
  green: {
    card: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    icon: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    title: 'text-green-700 dark:text-green-300',
    value: 'text-green-900 dark:text-green-100',
  },
  red: {
    card: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
    title: 'text-red-700 dark:text-red-300',
    value: 'text-red-900 dark:text-red-100',
  },
  navy: {
    card: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30',
    icon: 'bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-blue-900/50 dark:text-blue-300',
    title: 'text-slate-600 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-100',
  },
  yellow: {
    card: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
    title: 'text-yellow-700 dark:text-yellow-300',
    value: 'text-yellow-900 dark:text-yellow-100',
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
        'rounded-lg border p-4 shadow-sm',
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
        <div className={cn('ml-3 rounded-lg p-2 shrink-0', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
