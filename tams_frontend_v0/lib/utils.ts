import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'PKR 0'
  return `PKR ${amount.toLocaleString('en-PK')}`
}

/** Converts a camelCase string to snake_case. Use when building FormData keys. */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, (char) => `_${char.toLowerCase()}`)
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM yyyy')
  } catch {
    return String(date)
  }
}

export function formatMonth(monthYear: string): string {
  try {
    const [year, month] = monthYear.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(d, 'MMMM yyyy')
  } catch {
    return monthYear
  }
}

export function getPhotoUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  const base = process.env.NEXT_PUBLIC_STATIC_URL || 'http://localhost:5001/static'
  return `${base}/${path}`
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'inactive':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'pending':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'sent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'approved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'present':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'absent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'leave':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'connected':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'disconnected':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

export function getPdfUrl(filePath: string): string {
  const base = process.env.NEXT_PUBLIC_STATIC_URL || 'http://localhost:5001/static'
  const match = filePath.match(/data[\\/](.+)$/)
  if (match) {
    return `${base}/${match[1].replace(/\\/g, '/')}`
  }
  return `${base}/${filePath}`
}
