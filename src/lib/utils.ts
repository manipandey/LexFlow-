import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'

import NepaliDate from 'nepali-date-converter'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'NPR'): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNepaliDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    const nd = new NepaliDate(d)
    return nd.format('MMMM D, YYYY')
  } catch (e) {
    return format(d, 'MMM d, yyyy')
  }
}

export function formatDate(date: string | Date | null | undefined, dual = true): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const adDate = format(d, 'MMM d, yyyy')
  if (dual) {
    return `${formatNepaliDate(d)} (${adDate})`
  }
  return adDate
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatHearingDate(date: string | Date | null | undefined, dual = true): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  
  const adDate = format(d, 'EEE, MMM d')
  if (dual) {
    return `${formatNepaliDate(d)} (${adDate})`
  }
  return adDate
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Case statuses
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    filed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    hearing_scheduled: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    awaiting_decision: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    // Task statuses
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
    // Invoice statuses
    draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    canceled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  }
  return colors[priority] ?? 'text-slate-400'
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    firm_owner: 'Managing Partner / Sr. Advocate',
    senior_lawyer: 'Senior Advocate',
    lawyer: 'Advocate',
    paralegal: 'Legal Assistant / Pleader',
    receptionist: 'Receptionist',
    client: 'Client',
  }
  return labels[role] ?? role
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
