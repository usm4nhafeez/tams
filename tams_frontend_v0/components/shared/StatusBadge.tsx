import { cn, getStatusColor } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  if (!status) return null
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {displayLabel}
    </span>
  )
}
